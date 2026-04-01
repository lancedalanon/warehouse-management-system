import { Request, Response } from 'express';
import { GetDashboardDataService } from '@/services/dashboards/GetDashboardDataService';
import { ExportToExcelService } from '@/services/dashboards/ExportToExcelService';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from '@/controllers/BaseController';
import { inject, injectable } from 'tsyringe';

@injectable()
export class DashboardController extends BaseController {
  constructor(
    @inject(GetDashboardDataService)
    private readonly getDashboardDataService: GetDashboardDataService,
    @inject(ExportToExcelService)
    private readonly exportToExcelService: ExportToExcelService,
  ) {
    super();
    this.getDashboardData = this.getDashboardData.bind(this);
    this.exportToExcel = this.exportToExcel.bind(this);
  }

  async getDashboardData(req: Request, res: Response) {
    const data = await this.getDashboardDataService.handle(req);

    ResponseHandler.success(res, 'Dashboard data fetched successfully', data);
  }

  async exportToExcel(req: Request, res: Response) {
    const data = await this.exportToExcelService.handle(req);

    ResponseHandler.success(res, 'Data exported to PDF successfully', data);
  }
}
