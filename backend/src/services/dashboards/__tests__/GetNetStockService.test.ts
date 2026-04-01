import 'reflect-metadata';
import { GetNetStockService } from '../GetNetStockService';
import { AppDataSource } from '@/data-source';
import { Request } from 'express';

describe('GetNetStockService', () => {
  let service: GetNetStockService;

  beforeEach(() => {
    service = new GetNetStockService();
    jest.clearAllMocks();
  });

  it('should return inbound, outbound and netStock', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      { inbound: 50, outbound: 20 },
    ]);

    const req = {
      query: { dateRange: 'weekly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({
      inbound: 50,
      outbound: 20,
      netStock: 30,
    });

    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should fallback to weekly when invalid dateRange is provided', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      { inbound: 10, outbound: 5 },
    ]);

    const req = {
      query: { dateRange: 'invalid-range' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.netStock).toBe(5);
  });

  it('should return zero values when query returns null', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      { inbound: null, outbound: null },
    ]);

    const req = {
      query: { dateRange: 'monthly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result).toEqual({
      inbound: 0,
      outbound: 0,
      netStock: 0,
    });
  });

  it('should support yearly dateRange', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      { inbound: 100, outbound: 40 },
    ]);

    const req = {
      query: { dateRange: 'yearly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.netStock).toBe(60);
  });
});