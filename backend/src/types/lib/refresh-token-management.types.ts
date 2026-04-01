export interface GenerateRefreshTokenParams {
  userId: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface GeneratedRefreshToken {
  userId: number;
  token: string;
  tokenHash: string;
  expiredAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
