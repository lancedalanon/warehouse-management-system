import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';
import { RefreshTokenService } from '../RefreshTokenService';
import { RefreshToken } from '@/entities/RefreshToken';
import { JwtService } from '@/lib/JwtService';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { RefreshTokenManager } from '@/lib/RefreshTokenManager';

jest.mock('@/lib/RefreshTokenManager');
jest.mock('@/lib/JwtService');

describe('RefreshTokenService', () => {
  let refreshTokenRepo: Partial<Repository<RefreshToken>>;
  let jwtService: Partial<JwtService>;
  let service: RefreshTokenService;

  const mockUser = {
    id: 1,
    email: 'user@test.com',
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    suffix: null,
    emailVerifiedAt: new Date(),
    roles: [{ code: 'ADMIN' }],
  } as User;

  const mockTokenEntry = {
    id: 1,
    tokenHash: 'hashed-token',
    expiredAt: new Date(Date.now() + 1000 * 60 * 60),
    isRevoked: false,
    user: mockUser,
    lastUsedAt: null,
  } as RefreshToken;

  beforeEach(() => {
    refreshTokenRepo = { findOne: jest.fn(), save: jest.fn() };
    jwtService = { generate: jest.fn() };

    // Register mocks in tsyringe container
    container.registerInstance('RefreshTokenRepository', refreshTokenRepo);
    container.registerInstance(JwtService, jwtService);

    // Resolve service from container
    service = container.resolve(RefreshTokenService);

    jest.clearAllMocks();
  });

  it('should throw if refresh token is missing', async () => {
    await expect(service.handle('')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if refresh token is invalid', async () => {
    (RefreshTokenManager.fingerprint as jest.Mock).mockReturnValue(
      'hashed-token',
    );
    (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.handle('some-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshTokenRepo.findOne).toHaveBeenCalledWith({
      where: { tokenHash: 'hashed-token', isRevoked: false },
      relations: ['user', 'user.roles'],
    });
  });

  it('should throw if refresh token is expired', async () => {
    (RefreshTokenManager.fingerprint as jest.Mock).mockReturnValue(
      'hashed-token',
    );
    const expiredToken = {
      ...mockTokenEntry,
      expiredAt: new Date(Date.now() - 1000),
    };
    (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(expiredToken);

    await expect(service.handle('some-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return user and accessToken on valid token', async () => {
    (RefreshTokenManager.fingerprint as jest.Mock).mockReturnValue(
      'hashed-token',
    );
    (refreshTokenRepo.findOne as jest.Mock).mockResolvedValue(mockTokenEntry);
    (jwtService.generate as jest.Mock).mockReturnValue('access-token');

    const result = await service.handle('some-token');

    expect(jwtService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: mockUser.id,
        email: mockUser.email,
        roles: ['ADMIN'],
      }),
    );

    expect(refreshTokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ lastUsedAt: expect.any(Date) }),
    );

    expect(result).toEqual({
      user: {
        id: mockUser.id,
        firstName: mockUser.firstName,
        middleName: mockUser.middleName,
        lastName: mockUser.lastName,
        suffix: mockUser.suffix,
        email: mockUser.email,
        roles: mockUser.roles,
        emailVerifiedAt: mockUser.emailVerifiedAt,
      },
      accessToken: 'access-token',
    });
  });
});
