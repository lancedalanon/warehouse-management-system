import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetAuditLogsService } from '@/services/audit-logs/GetAuditLogsService';
import { GetAuditLogService } from '@/services/audit-logs/GetAuditLogService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class AuditLogController extends BaseController {
  constructor(
    @inject(GetAuditLogsService)
    private readonly getAuditLogsService: GetAuditLogsService,
    @inject(GetAuditLogService)
    private readonly getAuditLogService: GetAuditLogService,
  ) {
    super();
    this.getAuditLog = this.getAuditLog.bind(this);
    this.getAuditLogs = this.getAuditLogs.bind(this);
  }

  async getAuditLog(req: Request, res: Response) {
    const result = await this.getAuditLogService.handle(req);

    ResponseHandler.success(res, 'Audit log retrieved successfully', result);
  }

  async getAuditLogs(req: Request, res: Response) {
    const result = await this.getAuditLogsService.handle(req);

    ResponseHandler.success(
      res,
      'Audit logs retrieved successfully',
      result.data,
      result.meta,
    );
  }
}
