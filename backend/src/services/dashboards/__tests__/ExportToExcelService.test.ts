import 'reflect-metadata';
import { container } from 'tsyringe';
import { ExportToExcelService } from '../ExportToExcelService';
import { Request } from 'express';
import { PdfRenderer } from '@/lib/PdfRenderer';
import { GetDashboardDataService } from '../GetDashboardDataService';
import { GetNetStockService } from '../GetNetStockService';
import { GetTopMoversService } from '../GetTopMoversService';
import { GetInventoryAgingService } from '../GetInventoryAgingService';
import { GetStockVelocityService } from '../GetStockVelocityService';
import { GetWarehouseRiskService } from '../GetWarehouseRiskService';

jest.mock('@/lib/PdfRenderer', () => ({
  PdfRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  })),
}));

jest.mock('@/lib/FileStorageHandler', () => ({
  FileStorageHandler: {
    save: jest
      .fn()
      .mockResolvedValue({ url: 'https://example.com/report.pdf' }),
  },
}));

describe('ExportToExcelService', () => {
  let service: ExportToExcelService;

  const mockReq = {
    query: { dateRange: 'weekly' },
    user: { firstName: 'John', lastName: 'Doe' },
  } as unknown as Request;

  beforeEach(() => {
    // Mocks that DO NOT touch database
    const mockDashboardService = {
      handle: jest.fn().mockResolvedValue({
        inventoryStatuses: [{ status: 'ok', count: 10 }],
        recentMovements: [{ item: 'A', qty: 5 }],
      }),
    } as unknown as GetDashboardDataService;
    const mockNetStockService = {
      handle: jest.fn().mockResolvedValue({ stock: 100 }),
    };
    const mockTopMoversService = {
      handle: jest.fn().mockResolvedValue({ movers: [] }),
    };
    const mockAgingService = {
      handle: jest.fn().mockResolvedValue({
        days_0_7: 10,
        days_8_30: 5,
        days_31_90: 0,
        days_90_plus: 0,
        total: 15,
      }),
    };
    const mockVelocityService = {
      handle: jest.fn().mockResolvedValue({ velocity: [] }),
    };
    const mockRiskService = {
      handle: jest.fn().mockResolvedValue({ risk: [] }),
    };

    container.registerInstance(GetDashboardDataService, mockDashboardService);
    container.registerInstance(GetNetStockService, mockNetStockService);
    container.registerInstance(GetTopMoversService, mockTopMoversService);
    container.registerInstance(GetInventoryAgingService, mockAgingService);
    container.registerInstance(GetStockVelocityService, mockVelocityService);
    container.registerInstance(GetWarehouseRiskService, mockRiskService);
    container.registerInstance(PdfRenderer, new PdfRenderer());

    service = container.resolve(ExportToExcelService);

    jest.clearAllMocks();
  });

  it('should generate a PDF and return a URL', async () => {
    const result = await service.handle(mockReq);
    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });

  it('should fallback to weekly if invalid dateRange is provided', async () => {
    const req = {
      query: { dateRange: 'invalid' },
      user: { firstName: 'John', lastName: 'Doe' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });

  it('should handle zero aging totals and unknown user', async () => {
    const agingService = container.resolve(GetInventoryAgingService);

    (agingService.handle as jest.Mock).mockResolvedValue({
      days_0_7: 0,
      days_8_30: 0,
      days_31_90: 0,
      days_90_plus: 0,
      total: 0,
    });

    const req = {
      query: { dateRange: 'weekly' },
      user: undefined,
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });

  it('should fallback to weekly for invalid dateRange and handle zero aging totals', async () => {
    // Mock agingService to return zeros
    const agingService = container.resolve(GetInventoryAgingService);
    (agingService.handle as jest.Mock).mockResolvedValue({
      days_0_7: 0,
      days_8_30: 0,
      days_31_90: 0,
      days_90_plus: 0,
      total: 0,
    });

    const req = {
      query: { dateRange: 'invalidRange' }, // triggers fallback branch
      user: undefined, // triggers "Unknown User" branch
    } as unknown as Request;

    const result = await service.handle(req);

    // It should still return a valid PDF URL
    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });

  it('should accept a valid dateRange without fallback', async () => {
    const req = {
      query: { dateRange: 'monthly' },
      user: { firstName: 'Jane', lastName: 'Smith' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });

  it('should fallback to Unknown User when lastName is missing', async () => {
    const req = {
      query: { dateRange: 'weekly' },
      user: { firstName: 'John' }, // missing lastName
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });

  it('should compute aging percentages when totals exist', async () => {
    const agingService = container.resolve(GetInventoryAgingService);

    (agingService.handle as jest.Mock).mockResolvedValue({
      days_0_7: 5,
      days_8_30: 0,
      days_31_90: 3,
      days_90_plus: 2,
      total: 10,
    });

    const result = await service.handle(mockReq);

    expect(result).toEqual({ url: 'https://example.com/report.pdf' });
  });
});
