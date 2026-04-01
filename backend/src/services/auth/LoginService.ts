import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { User } from '@/entities/User';
import { RefreshToken } from '@/entities/RefreshToken';
import { JwtService } from '@/lib/JwtService';
import { LoginDTO, LoginSchema } from '@/schemas/auth/LoginSchema';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { RefreshTokenManager } from '@/lib/RefreshTokenManager';
import { inject, injectable } from 'tsyringe';

@injectable()
export class LoginService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,

    @inject('RefreshTokenRepository')
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @inject(JwtService)
    private readonly jwtService: JwtService
  ) {}

  async handle(data: LoginDTO) {
    const parsed = LoginSchema.parse(data);

    const user = await this.userRepo.findOne({
      where: { email: parsed.email },
      relations: {
        roles: true,
      },
      select: [
        'id',
        'email',
        'firstName',
        'middleName',
        'lastName',
        'suffix',
        'password',
        'emailVerifiedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(parsed.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate refresh token
    const refreshTokenData = RefreshTokenManager.generate({
      userId: Number(user.id),
    });

    // Persist refresh token
    const refreshTokenEntity = this.refreshTokenRepo.create({
      userId: refreshTokenData.userId,
      tokenHash: refreshTokenData.tokenHash,
      expiredAt: refreshTokenData.expiredAt,
      ipAddress: refreshTokenData.ipAddress ?? null,
      userAgent: refreshTokenData.userAgent ?? null,
      isRevoked: false,
    });

    await this.refreshTokenRepo.save(refreshTokenEntity);

    // Generate access token
    const accessToken = this.jwtService.generate({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.code),
      emailVerifiedAt: user.emailVerifiedAt,
      firstName: user.firstName,
      lastName: user.lastName,
    });

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
      refreshToken: {
        token: refreshTokenData.token,
        expiredAt: refreshTokenData.expiredAt,
      },
    };
  }
}
