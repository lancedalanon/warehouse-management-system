import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, EntityManager } from 'typeorm';

import { CancelOrderService } from '@/services/orders/CancelOrderService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';

import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { Inventory } from '@/entities/Inventory';

import { AppDataSource } from '@/data-source';

import { OrderStatus } from '@/enums/OrderStatus';
import { OrderPriority } from '@/enums/OrderPriority';

import { JwtUserPayload } from '@/types/middlewares/express';
import { UpdateOrderDTO } from '@/schemas/orders/UpdateOrderSchema';
import { ValidationException } from '@/exceptions/ValidationException';

jest.mock('@/data-source', () => ({
  AppDataSource: {
    transaction: jest.fn(),
  },
}));

describe('CancelOrderService', () => {
  let service: CancelOrderService;

  let orderRepo: jest.Mocked<Repository<Order>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;

  let manager: jest.Mocked<EntityManager>;
  let auditLogService: jest.Mocked<CreateAuditLogService>;

  const mockUser: JwtUserPayload = {
    sub: 1,
    email: 'test@example.com',
    roles: [],
    emailVerifiedAt: null,
    firstName: 'Test',
    lastName: 'User',
    iat: 1,
    exp: 1,
    iss: 'test',
    aud: 'test',
  };

  const order = {
    id: 1,
    code: 'ORD-001',
    status: OrderStatus.PENDING,
  } as unknown as Order;

  const dto: UpdateOrderDTO = {
    code: 'ORD-001',
    status: OrderStatus.PENDING,
    recipientName: 'John Doe',
    shippingAddress: 'Manila',
    contactNumber: null,
    priorityLevel: OrderPriority.MEDIUM,
    expectedPickupDate: null,
    notes: null,
    items: [
      {
        inventorySourceId: 1,
        quantity: 5,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Persistent mocks
    orderRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Order>>;

    orderItemRepo = {
      find: jest.fn(),
      upsert: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderItem>>;

    inventoryRepo = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    manager = {
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // Return the persistent mocks from getRepository
    manager.getRepository.mockImplementation((entity) => {
      if (entity === Order) return orderRepo;
      if (entity === OrderItem) return orderItemRepo;
      if (entity === Inventory) return inventoryRepo;
      throw new Error('Unknown repository');
    });

    auditLogService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance(CreateAuditLogService, auditLogService);
    service = container.resolve(CancelOrderService);

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) =>
      fn(manager),
    );
  });

  it('should cancel order successfully', async () => {
    inventoryRepo.find.mockResolvedValue([
      {
        id: 1,
        storedQuantity: 10,
        product: { id: 1, name: 'Product A' },
      } as unknown as Inventory,
    ]);

    orderItemRepo.find.mockResolvedValue([]);
    orderRepo.save.mockResolvedValue({
      ...order,
      status: OrderStatus.CANCELLED,
    } as Order);

    const result = await service.handle(order, dto, mockUser);

    expect(orderItemRepo.upsert).toHaveBeenCalled();
    expect(orderRepo.save).toHaveBeenCalled();
    expect(auditLogService.handle).toHaveBeenCalled();
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  it('should soft delete removed order items', async () => {
    inventoryRepo.find.mockResolvedValue([
      {
        id: 1,
        storedQuantity: 10,
        product: { id: 1, name: 'Product A' },
      } as unknown as Inventory,
    ]);

    orderItemRepo.find.mockResolvedValue([
      { id: 10, inventorySourceId: 2 } as unknown as OrderItem,
    ]);

    orderRepo.save.mockResolvedValue(order);

    await service.handle(order, dto, mockUser);

    expect(orderItemRepo.softDelete).toHaveBeenCalledWith([10]);
  });

  it('should restore soft deleted items', async () => {
    inventoryRepo.find.mockResolvedValue([
      {
        id: 1,
        storedQuantity: 10,
        product: { id: 1, name: 'Product A' },
      } as unknown as Inventory,
    ]);

    orderItemRepo.find.mockResolvedValue([
      { id: 5, inventorySourceId: 1, deletedAt: new Date() } as unknown as OrderItem,
    ]);

    orderRepo.save.mockResolvedValue(order);

    await service.handle(order, dto, mockUser);

    expect(orderItemRepo.restore).toHaveBeenCalledWith([5]);
  });

  it('should soft delete multiple removed order items', async () => {
    inventoryRepo.find.mockResolvedValue([
      { id: 1, storedQuantity: 10, product: { id: 1 } } as unknown as Inventory,
    ]);

    orderItemRepo.find.mockResolvedValue([
      { id: 10, inventorySourceId: 2 } as unknown as OrderItem,
      { id: 11, inventorySourceId: 3 } as unknown as OrderItem,
    ]);

    orderRepo.save.mockResolvedValue(order);

    await service.handle(order, dto, mockUser);

    expect(orderItemRepo.softDelete).toHaveBeenCalledWith([10, 11]);
  });

  it('should restore multiple soft deleted items', async () => {
    inventoryRepo.find.mockResolvedValue([
      { id: 1, storedQuantity: 10, product: { id: 1 } } as unknown as Inventory,
    ]);

    orderItemRepo.find.mockResolvedValue([
      { id: 5, inventorySourceId: 1, deletedAt: new Date() } as unknown as OrderItem,
      { id: 6, inventorySourceId: 1, deletedAt: new Date() } as unknown as OrderItem,
    ]);

    orderRepo.save.mockResolvedValue(order);

    await service.handle(order, dto, mockUser);

    expect(orderItemRepo.restore).toHaveBeenCalledWith([5, 6]);
  });

  it('should upsert new items that are not in existing items', async () => {
    inventoryRepo.find.mockResolvedValue([
      { id: 1, storedQuantity: 10, product: { id: 1 } } as unknown as Inventory,
    ]);

    // Existing items does not include the incoming item
    orderItemRepo.find.mockResolvedValue([]);

    orderRepo.save.mockResolvedValue({
      ...order,
      status: OrderStatus.CANCELLED,
    } as Order);

    await service.handle(order, dto, mockUser);

    expect(orderItemRepo.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ inventorySourceId: 1, quantity: 5 }),
      ]),
      expect.any(Object),
    );
  });

  it('should throw ValidationException if order is already completed', async () => {
    order.status = OrderStatus.COMPLETED;

    await expect(service.handle(order, dto, mockUser)).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('should throw ValidationException if order code already exists', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 2 } as unknown as Order);

    await expect(
      service.handle(order, { ...dto, code: 'NEWCODE' }, mockUser),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if inventory not found', async () => {
    inventoryRepo.find.mockResolvedValue([]);

    await expect(service.handle(order, dto, mockUser)).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('should throw ValidationException if inventory stock insufficient', async () => {
    inventoryRepo.find.mockResolvedValue([
      {
        id: 1,
        storedQuantity: 2,
        product: { id: 1, name: 'Product A' },
      } as unknown as Inventory,
    ]);

    await expect(service.handle(order, dto, mockUser)).rejects.toBeInstanceOf(
      ValidationException,
    );
  });
});