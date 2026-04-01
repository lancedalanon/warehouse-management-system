import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetOrdersService } from '@/services/orders/GetOrdersService';
import { Order } from '@/entities/Order';

describe('GetOrdersService', () => {
  let orderRepo: Repository<Order>;
  let service: GetOrdersService;
  let qb: jest.Mocked<SelectQueryBuilder<Order>>;

  const mockOrders: Order[] = [
    {
      id: 1,
      code: 'ORD001',
      status: 'PENDING',
      recipientName: 'John Doe',
      shippingAddress: '123 Street',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Order,
  ];

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Order>>;

    orderRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Order>;

    container.registerInstance('OrderRepository', orderRepo);
    service = container.resolve(GetOrdersService);

    jest.clearAllMocks();
  });

  it('should return paginated orders', async () => {
    qb.getManyAndCount.mockResolvedValue([mockOrders, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(orderRepo.createQueryBuilder).toHaveBeenCalledWith('order');
    expect(qb.orderBy).toHaveBeenCalledWith('order.id', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual(mockOrders);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters when provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockOrders, 1]);

    const req = {
      query: { id: 1, code: 'ORD001', status: 'PENDING', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('order.id = :id', { id: 1 });
    expect(qb.andWhere).toHaveBeenCalledWith('order.code ILIKE :code', { code: '%ORD001%' });
    expect(qb.andWhere).toHaveBeenCalledWith('order.status = :status', { status: 'PENDING' });
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockOrders, 1]);

    const req = { query: { search: 'ORD', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('order.code ILIKE :search'),
      { search: '%ORD%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockOrders, 1]);

    const req = { query: { sortBy: 'recipientName', sortDirection: 'ASC', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('order.recipientName', 'ASC');
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockOrders, 1]);

    const req = { query: { sortBy: 'invalidColumn', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('order.id', 'DESC');
  });
});