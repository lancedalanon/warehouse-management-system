import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetRolesService } from '@/services/roles/GetRolesService';
import { Role } from '@/entities/Role';
import { Role as RoleEnum } from '@/enums/Role';

describe('GetRolesService', () => {
  let roleRepo: Repository<Role>;
  let service: GetRolesService;
  let qb: jest.Mocked<SelectQueryBuilder<Role>>;

  const mockRoles: Role[] = [
    {
      id: 1,
      name: 'User',
      code: 'USER',
    } as Role,
  ];

  beforeEach(() => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Role>>;

    roleRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Role>;

    container.registerInstance('RoleRepository', roleRepo);
    service = container.resolve(GetRolesService);

    jest.clearAllMocks();
  });

  it('should return paginated roles', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRoles, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(roleRepo.createQueryBuilder).toHaveBeenCalledWith('role');

    expect(qb.where).toHaveBeenCalledWith('role.code != :superadminCode', {
      superadminCode: RoleEnum.SUPERADMIN,
    });

    expect(qb.orderBy).toHaveBeenCalledWith('role.id', 'DESC');

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);

    expect(result.data).toEqual(mockRoles);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should filter by code and name', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRoles, 1]);

    const req = {
      query: {
        code: 'USER',
        name: 'User',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('role.code ILIKE :code', {
      code: '%USER%',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('role.name ILIKE :name', {
      name: '%User%',
    });
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRoles, 1]);

    const req = {
      query: {
        search: 'user',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('role.name ILIKE :search'),
      { search: '%user%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRoles, 1]);

    const req = {
      query: {
        sortBy: 'name',
        sortDirection: 'ASC',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('role.name', 'ASC');
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRoles, 1]);

    const req = {
      query: {
        sortBy: 'invalidColumn',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('role.id', 'DESC');
  });

  it('should cap limit to 100 when exceeding maximum', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRoles, 1]);

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
