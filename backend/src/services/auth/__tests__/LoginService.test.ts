import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { container } from 'tsyringe';
import { LoginService } from '../LoginService';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { RefreshTokenManager } from '@/lib/RefreshTokenManager';
import { LoginDTO, LoginSchema } from '@/schemas/auth/LoginSchema';
import { JwtService } from '@/lib/JwtService';
import type { Repository } from 'typeorm';
import type { User } from '@/entities/User';
import type { RefreshToken } from '@/entities/RefreshToken';

jest.mock('bcrypt');
jest.mock('@/lib/RefreshTokenManager');

describe('LoginService', () => {
  let userRepo: Repository<User>;
  let refreshTokenRepo: Repository<RefreshToken>;
  let jwtService: JwtService;
  let service: LoginService;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    suffix: null,
    password: 'hashedPassword',
    emailVerifiedAt: new Date(),
    roles: [{ code: 'ADMIN' }],
  } as unknown as User;

  const mockRefreshData = {
    userId: 1,
    token: 'plain-refresh-token',
    tokenHash: 'hashed-refresh-token',
    expiredAt: new Date(),
    ipAddress: null,
    userAgent: null,
  } as unknown as RefreshToken & { token: string };

  beforeEach(() => {
    // Create mocks with strong typing
    userRepo = {
      findOne: jest.fn(),
    } as unknown as Repository<User>;

    refreshTokenRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<RefreshToken>;

    jwtService = {
      generate: jest.fn(),
    } as unknown as JwtService;

    // Register dependencies in tsyringe container
    container.registerInstance('UserRepository', userRepo);
    container.registerInstance('RefreshTokenRepository', refreshTokenRepo);
    container.registerInstance(JwtService, jwtService);

    // Resolve service from container
    service = container.resolve(LoginService);

    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if user not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    const input: LoginDTO = { email: 'wrong@test.com', password: '123' };

    await expect(service.handle(input)).rejects.toThrow(UnauthorizedException);
    expect(userRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: input.email } })
    );
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const input: LoginDTO = { email: mockUser.email, password: 'wrongpass' };

    await expect(service.handle(input)).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).toHaveBeenCalledWith(input.password, mockUser.password);
  });

  it('should throw ZodError if input is invalid', () => {
    const input = { email: 'invalid-email', password: '' };
    expect(() => LoginSchema.parse(input)).toThrow(ZodError);
  });

  it('should return user, accessToken, and refreshToken on successful login', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (RefreshTokenManager.generate as jest.Mock).mockReturnValue(mockRefreshData);
    (refreshTokenRepo.create as jest.Mock).mockReturnValue({ ...mockRefreshData, isRevoked: false });
    (jwtService.generate as jest.Mock).mockReturnValue('access-token');

    const input: LoginDTO = { email: mockUser.email, password: 'correctpass' };
    const result = await service.handle(input);

    expect(RefreshTokenManager.generate).toHaveBeenCalledWith({ userId: mockUser.id });
    expect(refreshTokenRepo.create).toHaveBeenCalledWith({
      userId: mockRefreshData.userId,
      tokenHash: mockRefreshData.tokenHash,
      expiredAt: mockRefreshData.expiredAt,
      ipAddress: mockRefreshData.ipAddress,
      userAgent: mockRefreshData.userAgent,
      isRevoked: false,
    });
    expect(refreshTokenRepo.save).toHaveBeenCalled();
    expect(jwtService.generate).toHaveBeenCalledWith(expect.objectContaining({
      sub: mockUser.id,
      email: mockUser.email,
      roles: ['ADMIN'],
    }));

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
      refreshToken: {
        token: mockRefreshData.token,
        expiredAt: mockRefreshData.expiredAt,
      },
    });
  });

  it('should persist the refresh token entity', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (RefreshTokenManager.generate as jest.Mock).mockReturnValue(mockRefreshData);
    (refreshTokenRepo.create as jest.Mock).mockReturnValue({ ...mockRefreshData, isRevoked: false });
    (jwtService.generate as jest.Mock).mockReturnValue('access-token');

    await service.handle({ email: mockUser.email, password: 'correctpass' });

    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
  });
});