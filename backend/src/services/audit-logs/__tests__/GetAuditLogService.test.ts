import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { GetAuditLogService } from '../GetAuditLogService';
import { AuditLog } from '@/entities/AuditLog';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('GetAuditLogService', () => {
  let auditLogRepo: Repository<AuditLog>;
  let service: GetAuditLogService;

  const mockAuditLog = {
    id: 1,
    event: 'USER_CREATED',
    description: 'User created',
    auditableType: 'User',
    auditableId: 10,
    userId: 1,
    createdAt: new Date(),
  } as unknown as AuditLog;

  beforeEach(() => {
    auditLogRepo = {
      findOne: jest.fn(),
    } as unknown as Repository<AuditLog>;

    container.registerInstance('AuditLogRepository', auditLogRepo);

    service = container.resolve(GetAuditLogService);

    jest.clearAllMocks();
  });

  it('should throw NotFoundException if audit log does not exist', async () => {
    (auditLogRepo.findOne as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: '1' },
    } as unknown as Request;

    await expect(service.handle(req)).rejects.toThrow(NotFoundException);
  });

  it('should return audit log if found', async () => {
    (auditLogRepo.findOne as jest.Mock).mockResolvedValue(mockAuditLog);

    const req = {
      params: { id: '1' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(auditLogRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(result).toEqual(mockAuditLog);
  });
});
