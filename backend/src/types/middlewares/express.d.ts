import { Role } from '@/enums/Role';
import { JwtPayload } from 'jsonwebtoken';

export interface JwtUserPayload extends JwtPayload {
  sub: number;
  email: string;
  roles: Role[];
  emailVerifiedAt: Date | null;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
