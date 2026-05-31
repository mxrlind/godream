import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(config: ConfigService, private authService: AuthService) {
    super({
      clientID: config.get<string>('DISCORD_CLIENT_ID') || 'PLACEHOLDER',
      clientSecret: config.get<string>('DISCORD_CLIENT_SECRET') || 'PLACEHOLDER',
      callbackURL: config.get<string>('DISCORD_CALLBACK_URL'),
      scope: ['identify', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const avatarUrl = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : undefined;
    const result = await this.authService.oauthLogin('discord', profile.id, profile.email, profile.username, avatarUrl);
    done(null, result);
  }
}
