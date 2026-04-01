import 'reflect-metadata';
import { GetWarehouseRiskService } from '../GetWarehouseRiskService';
import { AppDataSource } from '@/data-source';
import { NetStock } from '@/types/services/dashboard/net-stock.types';

describe('GetWarehouseRiskService', () => {
  let service: GetWarehouseRiskService;

  beforeEach(() => {
    service = new GetWarehouseRiskService();
    jest.clearAllMocks();
  });

  it('should return true for hasWrittenOff when there are written-off movements', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ count: '5' }]);

    const netStock: NetStock = { inbound: 50, outbound: 10, netStock: 40 };
    const result = await service.handle(netStock);

    expect(result.hasWrittenOff).toBe(true);
    expect(result.noOutbound).toBe(false);
    expect(result.inventoryGrowing).toBe(true);

    expect(AppDataSource.query).toHaveBeenCalled();
  });

  it('should return false for hasWrittenOff when no written-off movements', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ count: '0' }]);

    const netStock: NetStock = { inbound: 20, outbound: 20, netStock: 0 };
    const result = await service.handle(netStock);

    expect(result.hasWrittenOff).toBe(false);
    expect(result.noOutbound).toBe(false);
    expect(result.inventoryGrowing).toBe(false);
  });

  it('should correctly detect noOutbound', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ count: '0' }]);

    const netStock: NetStock = { inbound: 15, outbound: 0, netStock: 15 };
    const result = await service.handle(netStock);

    expect(result.noOutbound).toBe(true);
    expect(result.inventoryGrowing).toBe(true);
  });

  it('should handle all true conditions', async () => {
    jest.spyOn(AppDataSource, 'query').mockResolvedValue([{ count: '3' }]);

    const netStock: NetStock = { inbound: 100, outbound: 0, netStock: 100 };
    const result = await service.handle(netStock);

    expect(result).toEqual({
      hasWrittenOff: true,
      noOutbound: true,
      inventoryGrowing: true,
    });
  });
});
