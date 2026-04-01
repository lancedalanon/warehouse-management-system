import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetUserService } from '@/services/users/GetUserService';
import { User } from '@/entities/User';
import { Repository, Not } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { Role as RoleEnum } from '@/enums/Role';

describe('GetUserService', () => {
  let userRepo: jest.Mocked<Repository<User>>;
  let service: GetUserService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    roles: [
      {
        id: 2,
        name: 'User',
        code: 'USER',
      },
    ],
  } as User;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    container.registerInstance('UserRepository', userRepo);

    service = container.resolve(GetUserService);

    jest.clearAllMocks();
  });

  it('should return the user successfully', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.handle(mockUser.id);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: mockUser.id,
        roles: {
          code: Not(RoleEnum.SUPERADMIN),
        },
      },
      relations: ['roles'],
    });

    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException if user does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: 999,
        roles: {
          code: Not(RoleEnum.SUPERADMIN),
        },
      },
      relations: ['roles'],
    });
  });
});