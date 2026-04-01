import 'reflect-metadata';
import { container } from 'tsyringe';
import { DeleteOrderService } from '@/services/orders/DeleteOrderService';
import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { DeepPartial, Repository } from 'typeorm';

describe('DeleteOrderService', () => {
  let orderRepo: jest.Mocked<Repository<Order>>;
  let orderItemRepo: jest.Mocked<Repository<OrderItem>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: DeleteOrderService;

  const existingOrder: Order = {
    id: 1,
    code: 'ORD001',
    items: [
        { id: 10, quantity: 2 } as OrderItem,
        { id: 11, quantity: 1 } as OrderItem,
    ],
  } as Order;

  const mockUser: JwtUserPayload = {
    sub: 1,
    email: 'user@example.com',
    roles: [],
    emailVerifiedAt: null,
    firstName: 'Test',
    lastName: 'User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'test',
    aud: 'test',
  };

  beforeEach(() => {
    orderRepo = {
      findOne: jest.fn(),
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<Order>>;

    orderItemRepo = {
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderItem>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('OrderRepository', orderRepo);
    container.registerInstance('OrderItemRepository', orderItemRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(DeleteOrderService);

    jest.clearAllMocks();
  });

  it('should soft delete an order and its items successfully', async () => {
    orderRepo.findOne.mockResolvedValue(existingOrder);
    orderItemRepo.softRemove.mockImplementation(
        (entity: DeepPartial<OrderItem> | DeepPartial<OrderItem>[]) => {
            const entities = Array.isArray(entity) ? entity : [entity];
            return Promise.resolve(entities.map((e) => ({ ...e } as OrderItem))[0]);
        }
    );

    orderRepo.softRemove.mockImplementation(
        (entity: DeepPartial<Order> | DeepPartial<Order>[]) => {
            const entities = Array.isArray(entity) ? entity : [entity];
            return Promise.resolve(entities.map((e) => ({ ...e } as Order))[0]);
        }
    );

    const result = await service.handle(existingOrder.id, mockUser);

    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: existingOrder.id },
      relations: ['items'],
    });

    expect(orderItemRepo.softRemove).toHaveBeenCalledWith(existingOrder.items);
    expect(orderRepo.softRemove).toHaveBeenCalledWith(existingOrder);

    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ORDER_DELETED',
      auditableType: 'Order',
      auditableId: existingOrder.id,
      userId: mockUser.sub,
      oldValues: existingOrder,
      description: `Order deleted with code ${existingOrder.code}`,
    }));

    expect(result).toEqual(existingOrder);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, mockUser)).rejects.toThrow(NotFoundException);

    expect(orderItemRepo.softRemove).not.toHaveBeenCalled();
    expect(orderRepo.softRemove).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should handle orders with no items gracefully', async () => {
    const orderNoItems = { ...existingOrder, items: [] } as unknown as Order;
    orderRepo.findOne.mockResolvedValue(orderNoItems);
    orderRepo.softRemove.mockResolvedValue(orderNoItems);

    const result = await service.handle(orderNoItems.id, mockUser);

    expect(orderItemRepo.softRemove).not.toHaveBeenCalled();
    expect(orderRepo.softRemove).toHaveBeenCalledWith(orderNoItems);
    expect(auditService.handle).toHaveBeenCalled();
    expect(result).toEqual(orderNoItems);
  });
});