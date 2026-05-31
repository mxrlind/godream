import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService, private authService: AuthService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') || 'PLACEHOLDER',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || 'PLACEHOLDER',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.noemail`;
    const result = await this.authService.oauthLogin('github', profile.id, email, profile.displayName || profile.username, profile.photos?.[0]?.value);
    done(null, result);
  }
}
