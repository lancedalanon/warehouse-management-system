import 'reflect-metadata';
import { GetTopMoversService } from '../GetTopMoversService';
import { AppDataSource } from '@/data-source';
import { Request } from 'express';

describe('GetTopMoversService', () => {
  let service: GetTopMoversService;

  beforeEach(() => {
    service = new GetTopMoversService();
    jest.clearAllMocks();
  });

  it('should map top movers correctly', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([
      {
        id: 1,
        name: 'Product A',
        sku: 'SKU-A',
        inbound: '120',
        outbound: '30',
        activity: '150',
      },
      {
        id: 2,
        name: 'Product B',
        sku: 'SKU-B',
        inbound: '50',
        outbound: '60',
        activity: '110',
      },
      {
        id: 3,
        name: 'Product C',
        sku: 'SKU-C',
        inbound: '10',
        outbound: '10',
        activity: '20',
      },
    ]);

    const req = { query: { dateRange: 'weekly' } } as unknown as Request;
    const result = await service.handle(req);

    expect(result).toHaveLength(3);

    expect(result[0]).toMatchObject({
      id: 1,
      name: 'Product A',
      net: 90,
      netPositive: true,
      netNegative: false,
      netZero: false,
      activityHigh: true,
      activityMedium: false,
      activityLow: false,
    });

    expect(result[1]).toMatchObject({
      id: 2,
      net: -10,
      netPositive: false,
      netNegative: true,
      netZero: false,
      activityHigh: true,
      activityMedium: false,
      activityLow: false,
    });

    expect(result[2]).toMatchObject({
      id: 3,
      net: 0,
      netPositive: false,
      netNegative: false,
      netZero: true,
      activityHigh: false,
      activityMedium: false,
      activityLow: true,
    });

    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should fallback to weekly for invalid dateRange', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);

    const req = { query: { dateRange: 'invalid-range' } } as unknown as Request;
    const result = await service.handle(req);

    expect(result).toEqual([]);
    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should handle empty query result', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);

    const req = { query: { dateRange: 'monthly' } } as unknown as Request;
    const result = await service.handle(req);

    expect(result).toEqual([]);
  });
});