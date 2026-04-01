import { Repository } from 'typeorm';
import { RefreshToken } from '@/entities/RefreshToken';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { inject, injectable } from 'tsyringe';
import { RefreshTokenManager } from '@/lib/RefreshTokenManager';

@injectable()
export class LogoutService {
  constructor(
    @inject('RefreshTokenRepository')
    private readonly refreshTokenRepo: Repository<RefreshToken>
  ) {}

  async handle(refreshTokenString: string) {
    if (!refreshTokenString) {
      throw new NotFoundException('Refresh token not provided');
    }

    const tokenHash = RefreshTokenManager.fingerprint(refreshTokenString);

    const refreshToken = await this.refreshTokenRepo.findOne({
      where: {
        tokenHash,
        isRevoked: false,
      },
    });

    if (!refreshToken) {
      return { message: 'No refresh token provided' };
    }

    refreshToken.isRevoked = true;
    refreshToken.revokedAt = new Date();

    await this.refreshTokenRepo.save(refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }
}
