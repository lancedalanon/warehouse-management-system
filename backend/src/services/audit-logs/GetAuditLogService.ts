import { Repository } from 'typeorm';
import { AuditLog } from '@/entities/AuditLog';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { NotFoundException } from '@/exceptions/NotFoundException';

@injectable()
export class GetAuditLogService implements BaseService {
  constructor(
    @inject('AuditLogRepository')
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async handle(req: Request): Promise<AuditLog> {
    const id = Number(req.params.id);

    const auditLog = await this.auditLogRepo.findOne({
      where: { id },
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with id ${id} not found`);
    }

    return auditLog;
  }
}
