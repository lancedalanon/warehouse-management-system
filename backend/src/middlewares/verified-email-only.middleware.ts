import { Request, Response, NextFunction } from 'express';
import { ForbiddenException } from '@/exceptions/ForbiddenException';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';

export function verifiedEmailOnly(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new UnauthorizedException('Authentication required');
  }

  if (!req.user.emailVerifiedAt) {
    throw new ForbiddenException(
      'Your email address has not been verified. Please verify your email first to proceed.',
    );
  }

  return next();
}
