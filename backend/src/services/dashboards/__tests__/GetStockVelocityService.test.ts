import 'reflect-metadata';
import { GetStockVelocityService } from '../GetStockVelocityService';
import { AppDataSource } from '@/data-source';
import { Request } from 'express';

describe('GetStockVelocityService', () => {
  let service: GetStockVelocityService;

  beforeEach(() => {
    service = new GetStockVelocityService();
    jest.clearAllMocks();
  });

  it('should calculate average per day and stock growth', async () => {
    // Suppose 50 inbound, 20 outbound
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ inbound: 50, outbound: 20 }]);

    const req = {
      query: { dateRange: 'weekly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.stockGrowth).toBe(30);
    expect(result.avgInboundPerDay).toBeGreaterThan(0);
    expect(result.avgOutboundPerDay).toBeGreaterThan(0);
    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should fallback to weekly when invalid dateRange', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ inbound: 14, outbound: 7 }]);

    const req = {
      query: { dateRange: 'invalid-range' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.stockGrowth).toBe(7);
  });

  it('should return zero values when query returns null', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ inbound: null, outbound: null }]);

    const req = {
      query: { dateRange: 'monthly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({
      avgInboundPerDay: 0,
      avgOutboundPerDay: 0,
      stockGrowth: 0,
    });
  });

  it('should support yearly dateRange', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ inbound: 365, outbound: 100 }]);

    const req = {
      query: { dateRange: 'yearly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.stockGrowth).toBe(265);
    expect(result.avgInboundPerDay).toBeGreaterThan(0);
    expect(result.avgOutboundPerDay).toBeGreaterThan(0);
  });
});