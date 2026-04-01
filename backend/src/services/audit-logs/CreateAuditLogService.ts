import { Repository } from 'typeorm';
import { AuditLog } from '@/entities/AuditLog';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import {
  CreateAuditLogDTO,
  CreateAuditLogSchema,
} from '@/schemas/audit-logs/CreateAuditLogSchema';

@injectable()
export class CreateAuditLogService implements BaseService {
  constructor(
    @inject('AuditLogRepository')
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async handle(data: CreateAuditLogDTO): Promise<AuditLog> {
    const parsedData = CreateAuditLogSchema.parse(data);

    const auditLog = this.auditLogRepo.create({
      event: parsedData.event,
      description: parsedData.description,
      auditableType: parsedData.auditableType,
      auditableId: parsedData.auditableId,
      userId: parsedData.userId,
      oldValues: parsedData.oldValues ?? null,
      newValues: parsedData.newValues ?? null,
    });

    return await this.auditLogRepo.save(auditLog);
  }
}
