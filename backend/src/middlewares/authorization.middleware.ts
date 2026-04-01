import { Request, Response, NextFunction } from 'express';
import { ForbiddenException } from '@/exceptions/ForbiddenException';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { Role } from '@/enums/Role';

export function authorizeRoles(requiredRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userRoles = req.user.roles;

    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      throw new ForbiddenException('User roles not found');
    }

    const hasRequiredRole = userRoles.some((role) =>
      requiredRoles.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return next();
  };
}
