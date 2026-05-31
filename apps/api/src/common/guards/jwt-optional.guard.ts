import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Soft JWT guard: attaches req.user if token is valid, but does NOT
 * reject unauthenticated requests. Useful for routes that work both
 * logged-in (with personalized data) and anonymous.
 */
@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(_err: any, user: any) {
    // Never throw — just return user (or null/undefined if no token)
    return user || null;
  }
}
