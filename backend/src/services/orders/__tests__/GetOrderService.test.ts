import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetOrderService } from '@/services/orders/GetOrderService';
import { Order } from '@/entities/Order';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('GetOrderService', () => {
  let orderRepo: jest.Mocked<Repository<Order>>;
  let service: GetOrderService;

  const existingOrder = {
    id: 1,
    items: [
      {
        id: 101,
        inventorySource: {
          id: 201,
          product: { id: 301, name: 'Product A' },
          location: { id: 401, name: 'Warehouse A' },
        },
      },
    ],
  } as unknown as Order;

  beforeEach(() => {
    orderRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Order>>;

    container.registerInstance('OrderRepository', orderRepo);

    service = container.resolve(GetOrderService);

    jest.clearAllMocks();
  });

  it('should return an order successfully', async () => {
    orderRepo.findOne.mockResolvedValue(existingOrder);

    const result = await service.handle(existingOrder.id);

    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: existingOrder.id },
      relations: [
        'items',
        'items.inventorySource',
        'items.inventorySource.product',
        'items.inventorySource.location',
      ],
    });

    expect(result).toEqual(existingOrder);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
      relations: [
        'items',
        'items.inventorySource',
        'items.inventorySource.product',
        'items.inventorySource.location',
      ],
    });
  });
});
