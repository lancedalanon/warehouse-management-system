import 'reflect-metadata';
import { container } from 'tsyringe';
import { UpdatePasswordService } from '../UpdatePasswordService';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import type { Request } from 'express';

jest.mock('bcrypt');

describe('UpdatePasswordService', () => {
  let userRepo: Repository<User>;
  let service: UpdatePasswordService;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    password: 'oldHash',
    firstName: 'Old',
    middleName: null,
    lastName: 'Name',
    suffix: null,
    roles: [{ id: 1, code: 'USER', name: 'User' }],
    updatedAt: new Date(),
  } as unknown as User;

  const validPayload = {
    currentPassword: 'current123',
    newPassword: 'newpass123',
    confirmNewPassword: 'newpass123',
  };

  beforeEach(() => {
    userRepo = { findOne: jest.fn(), save: jest.fn() } as unknown as Repository<User>;
    container.registerInstance('UserRepository', userRepo);
    service = container.resolve(UpdatePasswordService);
    jest.clearAllMocks();
  });

  it('should throw if unauthenticated', async () => {
    const req = { user: null } as unknown as Request;
    await expect(service.handle(req, validPayload))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should throw if user not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const req = { user: { sub: 1 } } as unknown as Request;
    await expect(service.handle(req, validPayload))
      .rejects.toThrow('User not found');
  });

  it('should throw if current password is incorrect', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(service.handle(req, validPayload))
      .rejects.toThrow('Incorrect current password');
  });

  it('should throw if new password is same as current', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true)  // current password correct
      .mockResolvedValueOnce(true); // new password same
    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(service.handle(req, {
      ...validPayload,
      newPassword: 'current123',
      confirmNewPassword: 'current123',
    })).rejects.toThrow(BadRequestException);
  });

  it('should successfully update password', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock)
      .mockResolvedValueOnce(true)  // current password correct
      .mockResolvedValueOnce(false); // new password different
    (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');

    const req = { user: { sub: 1 } } as unknown as Request;
    const result = await service.handle(req, validPayload);

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'newHash' }));
    expect(result).toEqual(expect.objectContaining({
      firstName: 'Old',
      email: 'test@test.com',
    }));
  });
});