import { inject, injectable } from 'tsyringe';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { GetDashboardDataService } from '@/services/dashboards/GetDashboardDataService';
import { GetNetStockService } from '@/services/dashboards/GetNetStockService';
import { GetTopMoversService } from '@/services/dashboards/GetTopMoversService';
import { GetInventoryAgingService } from '@/services/dashboards/GetInventoryAgingService';
import { GetStockVelocityService } from '@/services/dashboards/GetStockVelocityService';
import { GetWarehouseRiskService } from '@/services/dashboards/GetWarehouseRiskService';
import { PdfRenderer } from '@/lib/PdfRenderer';
import { FileStorageHandler } from '@/lib/FileStorageHandler';
import { DateRange } from '@/types/services/dashboard/dashboard.types';
import { getDateRangeBounds } from '@/utils/DateRangeHelper';
import { format } from 'date-fns';

@injectable()
export class ExportToExcelService implements BaseService {
  constructor(
    @inject(GetDashboardDataService)
    private readonly dashboardService: GetDashboardDataService,

    @inject(GetNetStockService)
    private readonly netStockService: GetNetStockService,

    @inject(GetTopMoversService)
    private readonly topMoversService: GetTopMoversService,

    @inject(GetInventoryAgingService)
    private readonly agingService: GetInventoryAgingService,

    @inject(GetStockVelocityService)
    private readonly velocityService: GetStockVelocityService,

    @inject(GetWarehouseRiskService)
    private readonly riskService: GetWarehouseRiskService,

    @inject(PdfRenderer)
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  async handle(req: Request) {
    const raw = (req.query as { dateRange?: string }).dateRange;
    const dateRange = ['today', 'weekly', 'monthly', 'yearly'].includes(
      raw || '',
    )
      ? raw
      : 'weekly';

    // Gather all the data
    const dashboard = await this.dashboardService.handle(req);
    const netStock = await this.netStockService.handle(req);
    const topMovers = await this.topMoversService.handle(req);
    const aging = await this.agingService.handle(req);
    const velocity = await this.velocityService.handle(req);
    const risk = await this.riskService.handle(netStock);

    // Calculate aging percentages and visibility flags
    const agingData = {
      ...aging,
      pct_0_7:
        aging.days_0_7 && aging.total
          ? (aging.days_0_7 / aging.total) * 100
          : 0,
      pct_8_30:
        aging.days_8_30 && aging.total
          ? (aging.days_8_30 / aging.total) * 100
          : 0,
      pct_31_90:
        aging.days_31_90 && aging.total
          ? (aging.days_31_90 / aging.total) * 100
          : 0,
      pct_90_plus:
        aging.days_90_plus && aging.total
          ? (aging.days_90_plus / aging.total) * 100
          : 0,

      pct_0_7_show: aging.days_0_7 > 0,
      pct_8_30_show: aging.days_8_30 > 0,
      pct_31_90_show: aging.days_31_90 > 0,
      pct_90_plus_show: aging.days_90_plus > 0,
    };

    // Calculate date range bounds for the report
    const { startDate, endDate } = getDateRangeBounds(dateRange as DateRange);

    // Prepare data for the template
    const generatedBy =
      req.user?.firstName && req.user?.lastName
        ? `${req.user.firstName} ${req.user.lastName}`
        : 'Unknown User';

    const templateData = {
      meta: {
        dateRange: `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`,
        generatedAt: format(new Date(), 'PPpp'),
        generatedBy,
      },
      data: {
        statusSummary: dashboard.inventoryStatuses,
        trends: dashboard.recentMovements,
        netStock,
        topMovers,
        aging: agingData,
        velocity,
        risk,
      },
    };

    // Generate unique file path
    const filePath = `reports/warehouse-${format(startDate, 'yyyy-MM-dd')}-${format(
      endDate,
      'yyyy-MM-dd',
    )}-${new Date().getTime()}.pdf`;

    const pdfBuffer = await this.pdfRenderer.render({
      template: 'reports/warehouse-report.hbs',
      data: templateData,
    });

    // Save PDF
    const saved = await FileStorageHandler.save(pdfBuffer, filePath);

    return {
      url: saved.url,
    };
  }
}
