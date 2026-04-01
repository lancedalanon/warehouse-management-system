import 'reflect-metadata';
import { GetInventoryAgingService } from '../GetInventoryAgingService';
import { AppDataSource } from '@/data-source';
import { Request } from 'express';

describe('GetInventoryAgingService', () => {
  let service: GetInventoryAgingService;

  beforeEach(() => {
    service = new GetInventoryAgingService();
    jest.clearAllMocks();
  });

  it('should return inventory aging with calculated percentages', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      {
        days_0_7: 10,
        days_8_30: 5,
        days_31_90: 3,
        days_90_plus: 2,
      },
    ]);

    const req = {
      query: { dateRange: 'weekly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({
      days_0_7: 10,
      days_8_30: 5,
      days_31_90: 3,
      days_90_plus: 2,
      total: 20,
      pct_0_7: 50,
      pct_8_30: 25,
      pct_31_90: 15,
      pct_90_plus: 10,
    });

    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should handle zero totals and return zero percentages', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      {
        days_0_7: 0,
        days_8_30: 0,
        days_31_90: 0,
        days_90_plus: 0,
      },
    ]);

    const req = {
      query: { dateRange: 'weekly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({
      days_0_7: 0,
      days_8_30: 0,
      days_31_90: 0,
      days_90_plus: 0,
      total: 0,
      pct_0_7: 0,
      pct_8_30: 0,
      pct_31_90: 0,
      pct_90_plus: 0,
    });
  });

  it('should fallback to weekly when invalid dateRange is provided', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      {
        days_0_7: 1,
        days_8_30: 1,
        days_31_90: 1,
        days_90_plus: 1,
      },
    ]);

    const req = {
      query: { dateRange: 'invalid' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.total).toBe(4);
    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should support yearly dateRange', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      {
        days_0_7: 2,
        days_8_30: 2,
        days_31_90: 2,
        days_90_plus: 2,
      },
    ]);

    const req = {
      query: { dateRange: 'yearly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.total).toBe(8);
  });
});
