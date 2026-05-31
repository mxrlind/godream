import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService, private authService: AuthService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'PLACEHOLDER',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'PLACEHOLDER',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { id, displayName, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const avatarUrl = photos?.[0]?.value;
    const result = await this.authService.oauthLogin('google', id, email, displayName, avatarUrl);
    done(null, result);
  }
}
