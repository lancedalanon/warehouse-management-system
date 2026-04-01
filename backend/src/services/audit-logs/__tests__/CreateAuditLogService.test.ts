import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '../CreateAuditLogService';
import { AuditLog } from '@/entities/AuditLog';

describe('CreateAuditLogService', () => {
  let auditLogRepo: Repository<AuditLog>;
  let service: CreateAuditLogService;

  const mockAuditLog = {
    id: 1,
    event: 'USER_CREATED',
    description: 'User created',
    auditableType: 'User',
    auditableId: 10,
    userId: 1,
    oldValues: null,
    newValues: { name: 'John' },
    createdAt: new Date(),
  } as unknown as AuditLog;

  beforeEach(() => {
    auditLogRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<AuditLog>;

    container.registerInstance('AuditLogRepository', auditLogRepo);

    service = container.resolve(CreateAuditLogService);

    jest.clearAllMocks();
  });

  it('should throw validation error if schema validation fails', async () => {
    await expect(
      service.handle({
        event: '',
        description: '',
        auditableType: '',
        auditableId: 0,
        userId: 0,
      })
    ).rejects.toThrow();
  });

  it('should create and save audit log successfully', async () => {
    const input = {
      event: 'USER_CREATED',
      description: 'User created',
      auditableType: 'User',
      auditableId: 10,
      userId: 1,
      oldValues: null,
      newValues: { name: 'John' },
    };

    (auditLogRepo.create as jest.Mock).mockReturnValue(mockAuditLog);
    (auditLogRepo.save as jest.Mock).mockResolvedValue(mockAuditLog);

    const result = await service.handle(input);

    expect(auditLogRepo.create).toHaveBeenCalledWith({
      event: input.event,
      description: input.description,
      auditableType: input.auditableType,
      auditableId: input.auditableId,
      userId: input.userId,
      oldValues: null,
      newValues: input.newValues,
    });

    expect(auditLogRepo.save).toHaveBeenCalledWith(mockAuditLog);

    expect(result).toEqual(mockAuditLog);
  });

  it('should default oldValues and newValues to null if not provided', async () => {
    const input = {
      event: 'USER_UPDATED',
      description: 'User updated profile',
      auditableType: 'User',
      auditableId: 5,
      userId: 1,
    };

    (auditLogRepo.create as jest.Mock).mockReturnValue(mockAuditLog);
    (auditLogRepo.save as jest.Mock).mockResolvedValue(mockAuditLog);

    await service.handle(input);

    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        oldValues: null,
        newValues: null,
      })
    );
  });
});