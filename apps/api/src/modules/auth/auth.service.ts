import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, User } from '@godream/database';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { DATABASE_SERVICE } from '../../common/database/database.module';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { GamificationService } from '../gamification/gamification.service';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly gamification: GamificationService,
  ) {}

  // ─── Register ─────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existingEmail = await this.db.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email já cadastrado');

    const existingUsername = await this.db.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictException('Nome de usuário já em uso');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.db.user.create({
      data: {
        email: dto.email,
        username: dto.username.toLowerCase(),
        name: dto.name,
        passwordHash,
        role: dto.role || 'STUDENT',
        gamification: { create: {} },
        subscription: { create: { plan: 'FREE' } },
      },
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Login ────────────────────────────────────────────────
  async login(dto: LoginDto, userAgent?: string, ip?: string) {
    const user = await this.db.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Credenciais inválidas');

    if (user.isBanned) {
      throw new UnauthorizedException(`Conta suspensa: ${user.banReason || 'violação dos termos'}`);
    }

    // Update last login
    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken, userAgent, ip);

    // Tick streak on login
    await this.tickStreak(user.id);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── OAuth Login/Register ────────────────────────────────
  async oauthLogin(provider: string, providerId: string, email: string, name: string, avatarUrl?: string) {
    // Check if OAuth account exists
    let oauthAccount = await this.db.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });

    if (oauthAccount) {
      const tokens = await this.generateTokens(oauthAccount.user);
      await this.saveRefreshToken(oauthAccount.user.id, tokens.refreshToken);
      await this.tickStreak(oauthAccount.user.id);
      return { user: this.sanitizeUser(oauthAccount.user), ...tokens };
    }

    // Check if user with email exists
    let user = await this.db.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user
      const username = await this.generateUniqueUsername(name);
      user = await this.db.user.create({
        data: {
          email,
          username,
          name,
          avatarUrl,
          isVerified: true,
          gamification: { create: {} },
          subscription: { create: { plan: 'FREE' } },
        },
      });
    }

    // Link OAuth account
    await this.db.oAuthAccount.create({
      data: { userId: user.id, provider, providerId },
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    await this.tickStreak(user.id);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Refresh Tokens ───────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const session = await this.db.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.db.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    const tokens = await this.generateTokens(session.user);

    // Rotate refresh token
    await this.db.session.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: this.sanitizeUser(session.user), ...tokens };
  }

  // ─── Logout ───────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.db.session.deleteMany({ where: { userId, refreshToken } });
    } else {
      await this.db.session.deleteMany({ where: { userId } });
    }
  }

  // ─── Validate user (for local strategy) ──────────────────
  async validateUser(identifier: string, password: string) {
    const user = await this.db.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  // ─── Helpers ──────────────────────────────────────────────
  private async generateTokens(user: User) {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: uuid(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string, userAgent?: string, ip?: string) {
    await this.db.session.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        ipAddress: ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private async generateUniqueUsername(name: string): Promise<string> {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    let username = base;
    let attempt = 0;
    while (await this.db.user.findUnique({ where: { username } })) {
      attempt++;
      username = `${base}_${attempt}`;
    }
    return username;
  }

  private async tickStreak(userId: string) {
    return this.gamification.tickStreak(userId);
  }
}
