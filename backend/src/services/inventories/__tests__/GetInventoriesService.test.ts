import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetInventoriesService } from '@/services/inventories/GetInventoriesService';
import { Inventory } from '@/entities/Inventory';
import { Product } from '@/entities/Product';
import { Location } from '@/entities/Location';

describe('GetInventoriesService', () => {
  let inventoryRepo: Repository<Inventory>;
  let service: GetInventoriesService;
  let qb: jest.Mocked<SelectQueryBuilder<Inventory>>;

  const mockInventories: Inventory[] = [
    {
      id: 1,
      productId: 1,
      locationId: 1,
      storedQuantity: 100,
      product: { id: 1, name: 'Product A', sku: 'SKU001' } as Product,
      location: { id: 1, name: 'Main Warehouse', code: 'LOC001' } as Location,
    } as Inventory,
  ];

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Inventory>>;

    inventoryRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Inventory>;

    container.registerInstance('InventoryRepository', inventoryRepo);
    service = container.resolve(GetInventoriesService);

    jest.clearAllMocks();
  });

  it('should return paginated inventories', async () => {
    qb.getManyAndCount.mockResolvedValue([mockInventories, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(inventoryRepo.createQueryBuilder).toHaveBeenCalledWith('inventory');
    expect(qb.orderBy).toHaveBeenCalledWith('inventory.id', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual(mockInventories);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters when provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockInventories, 1]);

    const req = {
      query: {
        id: 1,
        productId: 1,
        locationId: 1,
        productIds: [1, 2],
        locationIds: [1],
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('inventory.id = :id', { id: 1 });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventory.productId = :productId',
      { productId: 1 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventory.locationId = :locationId',
      { locationId: 1 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventory.productId IN (:...productIds)',
      { productIds: [1, 2] },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'inventory.locationId IN (:...locationIds)',
      { locationIds: [1] },
    );
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockInventories, 1]);

    const req = {
      query: { search: 'Product', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('product.name ILIKE :search'),
      { search: '%Product%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockInventories, 1]);

    const req = {
      query: {
        sortBy: 'productName',
        sortDirection: 'ASC',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('product.name', 'ASC');
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockInventories, 1]);

    const req = {
      query: { sortBy: 'invalidColumn', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('inventory.id', 'DESC');
  });

  it('should cap limit at 100 even if higher value provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockInventories, 1]);

    const req = { query: { limit: 500, page: 1 } } as unknown as Request;

    await service.handle(req);

    expect(qb.take).toHaveBeenCalledWith(100);
  });
});
