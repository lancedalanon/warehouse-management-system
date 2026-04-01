import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@/lib/JwtService';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { JwtUserPayload } from '@/types/middlewares/express';

const jwtService = new JwtService();

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Access token missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = parts[1];

    const payload = jwtService.verify<JwtUserPayload>(token);

    req.user = payload;

    next();
  } catch {
    throw new UnauthorizedException('Invalid or expired access token');
  }
}
