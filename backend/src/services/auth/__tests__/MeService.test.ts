import 'reflect-metadata';
import { container } from 'tsyringe';
import { MeService } from '../MeService';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import type { Repository } from 'typeorm';
import type { Request } from 'express';

describe('MeService', () => {
  let userRepo: Repository<User>;
  let service: MeService;

  const mockUser = {
    id: 1,
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    suffix: null,
    email: 'test@test.com',
    roles: [{ id: 1, code: 'ADMIN', name: 'Admin' }],
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
    } as unknown as Repository<User>;

    container.registerInstance('UserRepository', userRepo);

    service = container.resolve(MeService);
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if user is not authenticated', async () => {
    const req = { user: null } as unknown as Request;

    await expect(service.handle(req)).rejects.toThrow(UnauthorizedException);
    await expect(service.handle(req)).rejects.toThrow('Unauthenticated');
  });

  it('should throw UnauthorizedException if user not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(service.handle(req)).rejects.toThrow(UnauthorizedException);
    await expect(service.handle(req)).rejects.toThrow('User not found');
  });

  it('should return user data successfully', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    const req = { user: { sub: 1 } } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({
      id: 1,
      firstName: 'John',
      middleName: 'M',
      lastName: 'Doe',
      suffix: null,
      email: 'test@test.com',
      roles: [{ id: 1, code: 'ADMIN', name: 'Admin' }],
      emailVerifiedAt: mockUser.emailVerifiedAt,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    });
  });
});
