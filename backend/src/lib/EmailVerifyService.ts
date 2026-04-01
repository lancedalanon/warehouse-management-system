import crypto from 'crypto';
import type { StringValue } from 'ms';

export interface EmailVerifyPayload {
  email: string;
  exp: number;
}

export class EmailVerifyService {
  private readonly secret: string;
  private readonly expiresIn: StringValue;

  constructor() {
    this.secret = process.env.EMAIL_VERIFY_SECRET || 'default_email_secret';
    this.expiresIn = (process.env.EMAIL_VERIFY_EXPIRES as StringValue) || '15m';
  }

  /**
   * Convert the expiresIn string like '15m', '1h' into seconds
   */
  private get expiresInSec(): number {
    const value = Number(this.expiresIn.replace(/\D/g, ''));
    const unit = this.expiresIn.replace(/\d/g, '');
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // default 15 minutes
    }
  }

  /**
   * Generate a tamper-proof HMAC token containing email + exp
   */
  generate(payload: { email: string }): string {
    const tokenPayload: EmailVerifyPayload = {
      email: payload.email,
      exp: Math.floor(Date.now() / 1000) + this.expiresInSec,
    };

    const payloadBase64 = Buffer.from(JSON.stringify(tokenPayload)).toString(
      'base64url',
    );

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payloadBase64)
      .digest('base64url');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Verify a token and return the payload if valid, otherwise throws
   */
  verify<T extends EmailVerifyPayload = EmailVerifyPayload>(token: string): T {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) throw new Error('Invalid token format');

    const expectedSig = crypto
      .createHmac('sha256', this.secret)
      .update(payloadBase64)
      .digest('base64url');

    const sigOk = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig),
    );

    if (!sigOk) throw new Error('Invalid token signature');

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString(),
    ) as T;

    if (payload.exp < Math.floor(Date.now() / 1000))
      throw new Error('Token expired');

    return payload;
  }
}
