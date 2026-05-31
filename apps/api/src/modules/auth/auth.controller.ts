import {
  Controller, Post, Get, Body, Req, Res, UseGuards,
  HttpCode, HttpStatus, Headers, Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Criar nova conta' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login com email/username + senha' })
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.login(dto, userAgent, ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout (invalida sessão)' })
  async logout(@CurrentUser('id') userId: string, @Body('refreshToken') refreshToken?: string) {
    await this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retorna usuário autenticado' })
  async me(@CurrentUser() user: any) {
    return user;
  }

  // ─── OAuth — Google ────────────────────────────────────────
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar OAuth Google' })
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    res.redirect(`${process.env.APP_URL}/auth/callback?token=${user.accessToken}&refresh=${user.refreshToken}`);
  }

  // ─── OAuth — GitHub ────────────────────────────────────────
  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Iniciar OAuth GitHub' })
  githubAuth() {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    res.redirect(`${process.env.APP_URL}/auth/callback?token=${user.accessToken}&refresh=${user.refreshToken}`);
  }

  // ─── OAuth — Discord ───────────────────────────────────────
  @Public()
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Iniciar OAuth Discord' })
  discordAuth() {}

  @Public()
  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    res.redirect(`${process.env.APP_URL}/auth/callback?token=${user.accessToken}&refresh=${user.refreshToken}`);
  }
}
