import {
  GeneratedRefreshToken,
  GenerateRefreshTokenParams,
} from '@/types/lib/refresh-token-management.types';
import crypto from 'crypto';

export class RefreshTokenManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12;
  private static readonly TOKEN_LENGTH = 64;

  private static get secret(): Buffer {
    const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_TOKEN_SECRET not set');
    return crypto.createHash('sha256').update(secret).digest();
  }

  private static parseExpiry(): number {
    const raw = process.env.JWT_REFRESH_TOKEN_EXPIRES;
    if (!raw) throw new Error('JWT_REFRESH_TOKEN_EXPIRES not set');

    const match = raw.match(/^(\d+)([dhm])$/);
    if (!match) throw new Error('Invalid JWT_REFRESH_TOKEN_EXPIRES format');

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      default:
        throw new Error('Invalid expiry unit');
    }
  }

  static decrypt(encrypted: string): string {
    const buffer = Buffer.from(encrypted, 'base64');

    const iv = buffer.subarray(0, this.IV_LENGTH);
    const authTag = buffer.subarray(this.IV_LENGTH, this.IV_LENGTH + 16);
    const data = buffer.subarray(this.IV_LENGTH + 16);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.secret, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8',
    );
  }

  static generate(params: GenerateRefreshTokenParams): GeneratedRefreshToken {
    const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const expiredAt = new Date(Date.now() + this.parseExpiry());

    return {
      userId: params.userId,
      token,
      tokenHash: this.fingerprint(token),
      expiredAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    };
  }

  static fingerprint(token: string): string {
    return crypto.createHmac('sha256', this.secret).update(token).digest('hex');
  }
}
