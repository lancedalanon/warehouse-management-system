import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetAuditLogsService } from '../GetAuditLogsService';
import { AuditLog } from '@/entities/AuditLog';

describe('GetAuditLogsService', () => {
  let auditLogRepo: Repository<AuditLog>;
  let service: GetAuditLogsService;

  const mockLogs: AuditLog[] = [
    {
      id: 1,
      event: 'USER_CREATED',
      description: 'User created',
    } as AuditLog,
  ];

  let qb: jest.Mocked<SelectQueryBuilder<AuditLog>>;

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<AuditLog>>;

    auditLogRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<AuditLog>;

    container.registerInstance('AuditLogRepository', auditLogRepo);

    service = container.resolve(GetAuditLogsService);

    jest.clearAllMocks();
  });

  it('should return paginated audit logs', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(auditLogRepo.createQueryBuilder).toHaveBeenCalledWith('audit');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('audit.user', 'user');

    expect(qb.orderBy).toHaveBeenCalled();
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);

    expect(result.data).toEqual(mockLogs);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters when provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        event: 'USER_CREATED',
        userId: 1,
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        search: 'user',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('should apply custom sorting when sortBy is provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        sortBy: 'event',
        sortDirection: 'DESC',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('audit.event', 'DESC');
  });

  it('should apply auditableType and auditableId filters', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        auditableType: 'User',
        auditableId: 5,
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      'audit.auditableType = :auditableType',
      { auditableType: 'User' },
    );

    expect(qb.andWhere).toHaveBeenCalledWith(
      'audit.auditableId = :auditableId',
      { auditableId: 5 },
    );
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        sortBy: 'invalidColumn',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('audit.id', 'DESC');
  });

  it('should filter by id when provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

    const req = {
      query: {
        id: 7,
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('audit.id = :id', { id: 7 });
  });

  it('should cap limit to 100 when limit exceeds maximum', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLogs, 1]);

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
