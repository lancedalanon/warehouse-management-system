import 'reflect-metadata';
import { container } from 'tsyringe';
import bcrypt from 'bcrypt';
import { ChangePasswordService } from '../ChangePasswordService';
import { User } from '@/entities/User';
import { PasswordRequest } from '@/entities/PasswordRequest';
import { BadRequestException } from '@/exceptions/BadRequestException';
import type { Repository } from 'typeorm';
import type { Request } from 'express';

jest.mock('bcrypt');

describe('ChangePasswordService', () => {
  let passwordRequestRepo: Repository<PasswordRequest>;
  let userRepo: Repository<User>;
  let service: ChangePasswordService;

  const mockUser = {
    email: 'test@test.com',
    password: 'oldHash',
  } as unknown as User;

  const mockRequest = {
    email: 'test@test.com',
    token: 'token123',
    createdAt: new Date(),
    usedAt: null,
  } as unknown as PasswordRequest;

  beforeEach(() => {
    // Mocks for repositories
    passwordRequestRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<PasswordRequest>;

    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<User>;

    // Register in tsyringe
    container.registerInstance('PasswordRequestRepository', passwordRequestRepo);
    container.registerInstance('UserRepository', userRepo);

    service = container.resolve(ChangePasswordService);

    jest.clearAllMocks();
  });

  const buildReq = (overrides?: Partial<Request>): Request =>
    ({
      query: { email: 'test@test.com', token: 'token123', ...(overrides?.query ?? {}) },
      body: { password: 'newpass123', confirmPassword: 'newpass123', ...(overrides?.body ?? {}) },
    } as unknown as Request);

  it('should throw if request not found', async () => {
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.handle(buildReq())).rejects.toThrow(BadRequestException);
  });

  it('should throw if token already used', async () => {
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue({ ...mockRequest, usedAt: new Date() });

    await expect(service.handle(buildReq())).rejects.toThrow('This token has already been used');
  });

  it('should throw if token expired', async () => {
    const expiredRequest = { ...mockRequest, createdAt: new Date(Date.now() - 16 * 60 * 1000) };
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(expiredRequest);

    await expect(service.handle(buildReq())).rejects.toThrow('Password reset token has expired');
  });

  it('should throw if user not found', async () => {
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(mockRequest);
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.handle(buildReq())).rejects.toThrow('User not found');
  });

  it('should successfully change password', async () => {
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(mockRequest);
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

    const result = await service.handle(buildReq());

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashedNewPassword' }));
    expect(passwordRequestRepo.save).toHaveBeenCalledWith(expect.objectContaining({ usedAt: expect.any(Date) }));
    expect(result).toEqual({ message: 'Password changed successfully' });
  });
});