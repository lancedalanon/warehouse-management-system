import { Request, Response } from 'express';
import { GetStatusService } from '@/services/health/GetStatusService';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from '@/controllers/BaseController';
import { inject, injectable } from 'tsyringe';

@injectable()
export class HealthController extends BaseController {
  constructor(
    @inject(GetStatusService) private readonly healthService: GetStatusService,
  ) {
    super();
    this.check = this.check.bind(this);
  }

  async check(_req: Request, res: Response) {
    const data = await this.healthService.handle();

    ResponseHandler.success(res, 'Health check successful', data);
  }
}
