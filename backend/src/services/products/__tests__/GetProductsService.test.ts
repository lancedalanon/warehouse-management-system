import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetProductsService } from '../GetProductsService';
import { Product } from '@/entities/Product';

describe('GetProductsService', () => {
  let productRepo: Repository<Product>;
  let service: GetProductsService;

  const mockProducts: Product[] = [
    {
      id: 1,
      sku: 'SKU001',
      name: 'Product 1',
      unitType: 'pcs',
      createdAt: new Date(),
    } as Product,
  ];

  let qb: jest.Mocked<SelectQueryBuilder<Product>>;

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Product>>;

    productRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Product>;

    container.registerInstance('ProductRepository', productRepo);
    service = container.resolve(GetProductsService);

    jest.clearAllMocks();
  });

  it('should return paginated products', async () => {
    qb.getManyAndCount.mockResolvedValue([mockProducts, 1]);

    const req = {
      query: { page: 1, limit: 10 },
    } as unknown as Request;

    const result = await service.handle(req);

    expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('product');
    expect(qb.orderBy).toHaveBeenCalledWith('product.id', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);

    expect(result.data).toEqual(mockProducts);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters when provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockProducts, 1]);

    const req = {
      query: {
        id: 1,
        sku: 'SKU001',
        name: 'Product 1',
        unitType: 'pcs',
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('product.id = :id', { id: 1 });
    expect(qb.andWhere).toHaveBeenCalledWith('product.sku ILIKE :sku', {
      sku: '%SKU001%',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('product.name ILIKE :name', {
      name: '%Product 1%',
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'product.unit_type ILIKE :unitType',
      { unitType: '%pcs%' },
    );
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockProducts, 1]);

    const req = {
      query: { search: 'prod', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('product.sku ILIKE :search'),
      { search: '%prod%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockProducts, 1]);

    const req = {
      query: { sortBy: 'name', sortDirection: 'ASC', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('product.name', 'ASC');
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockProducts, 1]);

    const req = {
      query: { sortBy: 'invalidColumn', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('product.id', 'DESC');
  });

  it('should cap limit to 100 when limit exceeds maximum', async () => {
    qb.getManyAndCount.mockResolvedValue([mockProducts, 1]);

    const req = {
      query: { page: 1, limit: 500 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.take).toHaveBeenCalledWith(100);
  });
});
