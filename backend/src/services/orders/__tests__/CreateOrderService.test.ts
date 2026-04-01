import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateOrderService } from '@/services/orders/CreateOrderService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { Inventory } from '@/entities/Inventory';
import { AppDataSource } from '@/data-source';
import { JwtUserPayload } from '@/types/middlewares/express';
import { CreateOrderDTO } from '@/schemas/orders/CreateOrderSchema';
import { OrderStatus } from '@/enums/OrderStatus';
import { OrderPriority } from '@/enums/OrderPriority';
import { ValidationException } from '@/exceptions/ValidationException';

jest.mock('@/data-source', () => ({
  AppDataSource: {
    transaction: jest.fn(),
  },
}));

describe('CreateOrderService', () => {
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: CreateOrderService;

  const user: JwtUserPayload = {
    sub: 1,
    email: 'admin@example.com',
    roles: [],
    emailVerifiedAt: null,
    firstName: 'Admin',
    lastName: 'User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'test-issuer',
    aud: 'test-audience',
  };

  const mockInventoryLowStock: Inventory = {
    id: 1,
    storedQuantity: 3,
    product: { id: 1, name: 'Product A' },
  } as Inventory;

  const mockInventorySufficient: Inventory = {
    id: 1,
    storedQuantity: 10, // enough stock
    product: { id: 1, name: 'Product A' },
  } as Inventory;

  const mockOrder: Order = {
    id: 1,
    code: 'ORD001',
    status: OrderStatus.PENDING,
    recipientName: 'John Doe',
    shippingAddress: '123 Street',
    contactNumber: null,
    priorityLevel: OrderPriority.MEDIUM,
    expectedPickupDate: null,
    notes: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Order; 

  beforeEach(() => {
    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;
    container.registerInstance(CreateAuditLogService, auditService);
    service = container.resolve(CreateOrderService);
    jest.clearAllMocks();
  });

  it('should create an order successfully', async () => {
    const dto: CreateOrderDTO = {
        code: 'ORD001',
        status: OrderStatus.PENDING,
        recipientName: 'John Doe',
        shippingAddress: '123 Street',
        contactNumber: null,
        priorityLevel: OrderPriority.MEDIUM,
        expectedPickupDate: null,
        notes: null,
        items: [{ inventorySourceId: 1, quantity: 5 }],
    };

    const managerMock = {
      getRepository: jest.fn((entity) => {
        if (entity === Order) {
            return {
                findOne: jest.fn().mockImplementation(({ where }) => {
                if (where.code) return null; // for duplicate code check
                if (where.id) return Promise.resolve(mockOrder); // for reloading after save
                return null;
                }),
                create: jest.fn().mockReturnValue(mockOrder),
                save: jest.fn().mockResolvedValue(mockOrder),
            };
        }
        if (entity === OrderItem) {
          return {
            create: jest.fn().mockImplementation(item => item),
            save: jest.fn().mockResolvedValue(dto.items),
          };
        }
        if (entity === Inventory) {
          return {
            find: jest.fn().mockResolvedValue([mockInventorySufficient]),
          };
        }
      }),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    const result = await service.handle(dto, user);

    expect(managerMock.getRepository).toHaveBeenCalledWith(Order);
    expect(managerMock.getRepository).toHaveBeenCalledWith(OrderItem);
    expect(managerMock.getRepository).toHaveBeenCalledWith(Inventory);
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'ORDER_CREATED',
      userId: user.sub,
    }));
    expect(result).toEqual(expect.objectContaining({ id: 1, code: 'ORD001' }));
  });

  it('should throw ValidationException if order code already exists', async () => {
    const dto: CreateOrderDTO = {
        code: 'ORD001',
        status: OrderStatus.PENDING, // optional but TS needs it
        recipientName: 'John Doe',
        shippingAddress: '123 Street',
        contactNumber: null, // optional
        priorityLevel: OrderPriority.MEDIUM, // optional
        expectedPickupDate: null, // optional
        notes: null, // optional
        items: [{ inventorySourceId: 1, quantity: 5 }],
    };

    const managerMock = {
      getRepository: jest.fn((entity) => {
        if (entity === Order) {
          return { findOne: jest.fn().mockResolvedValue(mockOrder) }; // duplicate
        }
        return {};
      }),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    await expect(service.handle(dto, user)).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if inventory not found', async () => {
    const dto: CreateOrderDTO = {
        code: 'ORD001',
        status: OrderStatus.PENDING, // optional but TS needs it
        recipientName: 'John Doe',
        shippingAddress: '123 Street',
        contactNumber: null, // optional
        priorityLevel: OrderPriority.MEDIUM, // optional
        expectedPickupDate: null, // optional
        notes: null, // optional
        items: [{ inventorySourceId: 1, quantity: 5 }],
    };

    const managerMock = {
      getRepository: jest.fn((entity) => {
        if (entity === Order) {
          return { findOne: jest.fn().mockResolvedValue(null), create: jest.fn(), save: jest.fn() };
        }
        if (entity === Inventory) {
          return { find: jest.fn().mockResolvedValue([]) };
        }
        if (entity === OrderItem) {
          return { create: jest.fn(), save: jest.fn() };
        }
      }),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    await expect(service.handle(dto, user)).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if insufficient stock', async () => {
    const dto: CreateOrderDTO = {
        code: 'ORD001',
        status: OrderStatus.PENDING, // optional but TS needs it
        recipientName: 'John Doe',
        shippingAddress: '123 Street',
        contactNumber: null, // optional
        priorityLevel: OrderPriority.MEDIUM, // optional
        expectedPickupDate: null, // optional
        notes: null, // optional
        items: [{ inventorySourceId: 1, quantity: 5 }],
    };

    const managerMock = {
      getRepository: jest.fn((entity) => {
        if (entity === Order) {
          return { findOne: jest.fn().mockResolvedValue(null), create: jest.fn(), save: jest.fn() };
        }
        if (entity === Inventory) {
          return { find: jest.fn().mockResolvedValue([mockInventoryLowStock]) };
        }
        if (entity === OrderItem) {
          return { create: jest.fn(), save: jest.fn() };
        }
      }),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    await expect(service.handle(dto, user)).rejects.toBeInstanceOf(ValidationException);
  });
});