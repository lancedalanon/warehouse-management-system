import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetUsersService } from '@/services/users/GetUsersService';
import { User } from '@/entities/User';
import { Role } from '@/enums/Role';

describe('GetUsersService', () => {
  let userRepo: Repository<User>;
  let service: GetUsersService;
  let qb: jest.Mocked<SelectQueryBuilder<User>>;

  const mockUsers: User[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: [{ id: 2, name: 'User', code: 'USER' }],
    } as unknown as User,
  ];

  beforeEach(() => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<User>>;

    userRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<User>;

    container.registerInstance('UserRepository', userRepo);
    service = container.resolve(GetUsersService);

    jest.clearAllMocks();
  });

  it('should return paginated users', async () => {
    qb.getManyAndCount.mockResolvedValue([mockUsers, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(userRepo.createQueryBuilder).toHaveBeenCalledWith('user');

    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('user.roles', 'roles');

    expect(qb.where).toHaveBeenCalledWith('roles.code != :superadmin', {
      superadmin: Role.SUPERADMIN,
    });

    expect(qb.orderBy).toHaveBeenCalledWith('user.id', 'DESC');

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);

    expect(result.data).toEqual(mockUsers);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply individual filters', async () => {
    qb.getManyAndCount.mockResolvedValue([mockUsers, 1]);

    const req = {
      query: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('user.id = :id', { id: 1 });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'user.firstName ILIKE :firstName',
      {
        firstName: '%John%',
      },
    );

    expect(qb.andWhere).toHaveBeenCalledWith('user.lastName ILIKE :lastName', {
      lastName: '%Doe%',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('user.email ILIKE :email', {
      email: '%john%',
    });
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockUsers, 1]);

    const req = {
      query: {
        search: 'john',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('user.firstName ILIKE :search'),
      { search: '%john%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockUsers, 1]);

    const req = {
      query: {
        sortBy: 'email',
        sortDirection: 'ASC',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('user.email', 'ASC');
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockUsers, 1]);

    const req = {
      query: {
        sortBy: 'invalidColumn',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('user.id', 'DESC');
  });

  it('should cap limit to 100 when exceeding maximum', async () => {
    qb.getManyAndCount.mockResolvedValue([mockUsers, 1]);

    const req = {
      query: {
        page: 1,
        limit: 500,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.take).toHaveBeenCalledWith(100);
  });
});
