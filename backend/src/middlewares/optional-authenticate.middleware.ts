import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@/lib/JwtService';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { JwtUserPayload } from '@/types/middlewares/express';

const jwtService = new JwtService();

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers['authorization'];

  // No token continue without user
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedException('Invalid authorization header format');
  }

  const token = parts[1];

  try {
    const payload = jwtService.verify<JwtUserPayload>(token);
    req.user = payload;
    return next();
  } catch {
    throw new UnauthorizedException('Invalid or expired access token');
  }
}
