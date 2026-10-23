import { ROLES_KEY } from '@/shared/auth/decorators/roles.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Runs after AuthenticatedUserGuard, so the session is already on the request.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles) return true;

    const user: Identity = context.switchToHttp().getRequest().session.user;
    if (!roles.includes(user.role)) {
      // 403: signed in, but not allowed
      throw new ForbiddenException();
    }
    return true;
  }
}
