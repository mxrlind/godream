import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '../../../common/database/database.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, username: true, name: true,
        role: true, avatarUrl: true, avatarColor: true,
        isVerified: true, isBanned: true, isCreator: true,
        creatorApproved: true,
      },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException('Usuário não encontrado ou suspenso');
    }

    return user;
  }
}
