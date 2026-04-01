import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import ms from 'ms';

export class JwtService {
  private expiresIn: StringValue;
  private secret: string;

  constructor() {
    this.secret = process.env.JWT_ACCESS_TOKEN_SECRET || 'default_secret';
    this.expiresIn =
      (process.env.JWT_ACCESS_TOKEN_EXPIRES as StringValue) || '15m';
  }

  generate(payload: object) {
    const options: SignOptions = { expiresIn: this.expiresIn };
    const token = jwt.sign(payload, this.secret, options);
    const expiredAt = new Date(Date.now() + ms(this.expiresIn));

    return {
      token,
      expiredAt,
    };
  }

  verify<T extends object = JwtPayload>(token: string): T {
    return jwt.verify(token, this.secret) as T;
  }
}
