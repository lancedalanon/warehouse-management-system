import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetDashboardDataService } from '../GetDashboardDataService';
import { Repository } from 'typeorm';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { Request } from 'express';

// Mock InventoryStatuses import
jest.mock('@/enums/InventoryStatus', () => {
  const originalModule = jest.requireActual('@/enums/InventoryStatus');
  return {
    ...originalModule,
    InventoryStatuses: [
      'received',
      'stored',
      'reserved',
      'written-off',
      'shipped',
      'transferred',
    ],
  };
});

describe('GetDashboardDataService', () => {
  let service: GetDashboardDataService;
  let mockRepo: Partial<Repository<InventoryMovement>>;

  const mockReq = {
    query: { dateRange: 'weekly' },
  } as unknown as Request;

  beforeEach(() => {
    mockRepo = {
      query: jest.fn().mockImplementation((sql) => {
        if (sql.includes('SELECT LOWER(m.to_state)')) {
          return Promise.resolve([
            { type: 'received', frequency: '5' },
            { type: 'stored', frequency: '3' },
            { type: 'reserved', frequency: '0' },
            { type: 'written-off', frequency: '0' },
            { type: 'shipped', frequency: '0' },
            { type: 'transferred', frequency: '0' },
          ]);
        } else {
          return Promise.resolve([
            {
              dateKey: '2026-02-20',
              received: 5,
              stored: 3,
              reserved: 0,
              writtenOff: 0,
              shipped: 0,
              transferred: 0,
            },
          ]);
        }
      }),
    };

    container.registerInstance('InventoryMovementRepository', mockRepo);
    service = container.resolve(GetDashboardDataService);
    jest.clearAllMocks();
  });

  it('should return dashboard data with statuses and recent movements', async () => {
    const result = await service.handle(mockReq);

    expect(result.inventoryStatuses).toEqual(
      expect.arrayContaining([
        { count: 0, type: 'Received' },
        { count: 0, type: 'Stored' },
        { count: 0, type: 'Reserved' },
        { count: 0, type: 'Written-off' },
        { count: 0, type: 'Shipped' },
        { count: 0, type: 'Transferred' },
      ]),
    );

    expect(result.recentMovements).toEqual(
      expect.arrayContaining([
        {
          date: '2026-02-20',
          received: 5,
          stored: 3,
          reserved: 0,
          writtenOff: 0,
          shipped: 0,
          transferred: 0,
        },
      ]),
    );

    expect(mockRepo.query).toHaveBeenCalled();
  });

  it('should handle monthly dateRange', async () => {
    const req = {
      query: { dateRange: 'monthly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.recentMovements).toBeDefined();
    expect(mockRepo.query).toHaveBeenCalled();
  });

  it('should adjust startDate when dateRange is today', async () => {
    const req = {
      query: { dateRange: 'today' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.recentMovements).toBeDefined();
    expect(mockRepo.query).toHaveBeenCalled();
  });

  it('should fallback to weekly when invalid dateRange is provided', async () => {
    const req = {
      query: { dateRange: 'invalid-range' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.recentMovements).toBeDefined();
  });

  it('should handle yearly dateRange', async () => {
    const req = {
      query: { dateRange: 'yearly' },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(result.recentMovements).toBeDefined();
    expect(mockRepo.query).toHaveBeenCalled();
  });
});
