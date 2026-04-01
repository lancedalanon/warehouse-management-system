import 'reflect-metadata';
import { container } from 'tsyringe';
import { UpdateAccountInfoService } from '../UpdateAccountInfoService';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import type { Repository } from 'typeorm';
import type { Request } from 'express';

describe('UpdateAccountInfoService', () => {
  let userRepo: Repository<User>;
  let service: UpdateAccountInfoService;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    firstName: 'Old',
    middleName: null,
    lastName: 'Name',
    suffix: null,
    roles: [{ id: 1, code: 'USER', name: 'User' }],
    updatedAt: new Date(),
    save: jest.fn(),
  } as unknown as User;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<User>;

    container.registerInstance('UserRepository', userRepo);

    service = container.resolve(UpdateAccountInfoService);

    jest.clearAllMocks();
  });

  it('should throw if unauthenticated', async () => {
    const req = { user: null } as unknown as Request;
    await expect(
      service.handle(req, { firstName: 'New', lastName: 'Name' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if user not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(
      service.handle(req, { firstName: 'New', lastName: 'Name' }),
    ).rejects.toThrow('User not found');
  });

  it('should successfully update user info', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

    const req = { user: { sub: 1 } } as unknown as Request;
    const data = {
      firstName: 'New',
      middleName: 'M',
      lastName: 'Name',
      suffix: 'Jr',
    };

    const result = await service.handle(req, data);

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'New',
        middleName: 'M',
        lastName: 'Name',
        suffix: 'Jr',
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        firstName: 'New',
        middleName: 'M',
        lastName: 'Name',
        suffix: 'Jr',
        email: 'test@test.com',
        roles: [{ id: 1, code: 'USER', name: 'User' }],
      }),
    );
  });
});
