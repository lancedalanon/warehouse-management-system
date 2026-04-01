import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';

import { UpdateOrderService } from '@/services/orders/UpdateOrderService';
import { PendingOrderService } from '@/services/orders/PendingOrderService';
import { ConfirmOrderService } from '@/services/orders/ConfirmOrderService';
import { CompleteOrderService } from '@/services/orders/CompleteOrderService';
import { CancelOrderService } from '@/services/orders/CancelOrderService';

import { Order } from '@/entities/Order';
import { OrderStatus } from '@/enums/OrderStatus';
import { JwtUserPayload } from '@/types/middlewares/express';
import { UpdateOrderDTO } from '@/schemas/orders/UpdateOrderSchema';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { OrderPriority } from '@/enums/OrderPriority';
import { ZodError } from 'zod';

describe('UpdateOrderService', () => {
  let service: UpdateOrderService;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let pendingService: jest.Mocked<PendingOrderService>;
  let confirmService: jest.Mocked<ConfirmOrderService>;
  let completeService: jest.Mocked<CompleteOrderService>;
  let cancelService: jest.Mocked<CancelOrderService>;

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

  const order = { id: 1, status: OrderStatus.PENDING } as unknown as Order;

  // Fully typed dto with all required fields
  const dto: UpdateOrderDTO = {
    code: 'ORD-001',
    status: OrderStatus.PENDING,
    recipientName: 'John Doe',
    shippingAddress: 'Manila',
    contactNumber: null,
    priorityLevel: OrderPriority.HIGH,
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

    orderRepo = { findOne: jest.fn() } as unknown as jest.Mocked<
      Repository<Order>
    >;
    pendingService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<PendingOrderService>;
    confirmService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<ConfirmOrderService>;
    completeService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CompleteOrderService>;
    cancelService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CancelOrderService>;

    container.registerInstance(PendingOrderService, pendingService);
    container.registerInstance(ConfirmOrderService, confirmService);
    container.registerInstance(CompleteOrderService, completeService);
    container.registerInstance(CancelOrderService, cancelService);
    container.registerInstance('OrderRepository', orderRepo);

    service = container.resolve(UpdateOrderService);
  });

  it('should delegate to PendingOrderService for PENDING status', async () => {
    orderRepo.findOne.mockResolvedValue(order);
    pendingService.handle.mockResolvedValue(order);

    const result = await service.handle(
      1,
      { ...dto, status: OrderStatus.PENDING },
      mockUser,
    );

    expect(pendingService.handle).toHaveBeenCalledWith(order, dto, mockUser);
    expect(result).toBe(order);
  });

  it('should delegate to ConfirmOrderService for CONFIRMED status', async () => {
    orderRepo.findOne.mockResolvedValue(order);
    confirmService.handle.mockResolvedValue(order);

    const result = await service.handle(
      1,
      { ...dto, status: OrderStatus.CONFIRMED },
      mockUser,
    );

    expect(confirmService.handle).toHaveBeenCalledWith(
      order,
      { ...dto, status: OrderStatus.CONFIRMED },
      mockUser,
    );
    expect(result).toBe(order);
  });

  it('should delegate to CancelOrderService for CANCELLED status', async () => {
    orderRepo.findOne.mockResolvedValue(order);
    cancelService.handle.mockResolvedValue(order);

    const result = await service.handle(
      1,
      { ...dto, status: OrderStatus.CANCELLED },
      mockUser,
    );

    expect(cancelService.handle).toHaveBeenCalledWith(
      order,
      { ...dto, status: OrderStatus.CANCELLED },
      mockUser,
    );
    expect(result).toBe(order);
  });

  it('should delegate to CompleteOrderService for COMPLETED status', async () => {
    orderRepo.findOne.mockResolvedValue(order);
    completeService.handle.mockResolvedValue(order);

    const result = await service.handle(
      1,
      { ...dto, status: OrderStatus.COMPLETED },
      mockUser,
    );

    expect(completeService.handle).toHaveBeenCalledWith(
      order,
      { ...dto, status: OrderStatus.COMPLETED },
      mockUser,
    );
    expect(result).toBe(order);
  });

  it('should throw ZodError for invalid status', async () => {
    orderRepo.findOne.mockResolvedValue(order);

    await expect(
      service.handle(
        1,
        { ...dto, status: 'INVALID_STATUS' as OrderStatus },
        mockUser,
      ),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('should throw NotFoundException if order not found', async () => {
    orderRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(1, dto, mockUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
