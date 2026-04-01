import { Repository } from 'typeorm';
import { RefreshToken } from '@/entities/RefreshToken';
import { JwtService } from '@/lib/JwtService';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { inject, injectable } from 'tsyringe';
import { RefreshTokenManager } from '@/lib/RefreshTokenManager';

@injectable()
export class RefreshTokenService {
  constructor(
    @inject('RefreshTokenRepository')
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @inject(JwtService)
    private readonly jwtService: JwtService
  ) {}

  async handle(refreshTokenString: string) {
    if (!refreshTokenString) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = RefreshTokenManager.fingerprint(refreshTokenString);

    const tokenEntry = await this.refreshTokenRepo.findOne({
      where: {
        tokenHash,
        isRevoked: false,
      },
      relations: ['user', 'user.roles'],
    });

    if (!tokenEntry) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntry.expiredAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = tokenEntry.user;

    const accessToken = this.jwtService.generate({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.code),
      emailVerifiedAt: user.emailVerifiedAt,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    tokenEntry.lastUsedAt = new Date();
    await this.refreshTokenRepo.save(tokenEntry);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        suffix: user.suffix,
        email: user.email,
        roles: user.roles,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      accessToken,
    };
  }
}
