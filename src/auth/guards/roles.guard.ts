import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../users/user.entity';
import { AuthenticatedUser } from '../auth.types';
import { ROLES_KEY } from '../decorators/roles.decorator';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const roles = (Reflect.getMetadata(ROLES_KEY, context.getHandler()) ??
      Reflect.getMetadata(ROLES_KEY, context.getClass())) as
      | UserRole[]
      | undefined;

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }

    return true;
  }
}
