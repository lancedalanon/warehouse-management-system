import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateInventoryService } from '@/services/inventories/CreateInventoryService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { Inventory } from '@/entities/Inventory';
import { Product } from '@/entities/Product';
import { Location } from '@/entities/Location';
import { AppDataSource } from '@/data-source';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ValidationException } from '@/exceptions/ValidationException';

jest.mock('@/data-source', () => ({
  AppDataSource: {
    transaction: jest.fn(),
  },
}));

describe('CreateInventoryService', () => {
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: CreateInventoryService;

  const mockInventory: Inventory = {
    id: 1,
    productId: 1,
    locationId: 1,
    storedQuantity: 0,
  } as Inventory;

  const mockProduct: Product = { id: 1, name: 'Test Product' } as Product;
  const mockLocation: Location = { id: 1, name: 'Main Warehouse' } as Location;

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

  beforeEach(() => {
    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;
    container.registerInstance(CreateAuditLogService, auditService);
    service = container.resolve(CreateInventoryService);
    jest.clearAllMocks();
  });

  it('should create inventory successfully', async () => {
    const dto = { productId: 1, locationId: 1 };

    const managerMock = {
      findOne: jest.fn()
        .mockResolvedValueOnce(mockProduct)  // product check
        .mockResolvedValueOnce(mockLocation) // location check
        .mockResolvedValueOnce(null),        // existing inventory check
      create: jest.fn().mockReturnValue(mockInventory),
      save: jest.fn().mockResolvedValue(mockInventory),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    const result = await service.handle(dto, user);

    expect(managerMock.findOne).toHaveBeenNthCalledWith(1, Product, { where: { id: dto.productId } });
    expect(managerMock.findOne).toHaveBeenNthCalledWith(2, Location, { where: { id: dto.locationId } });
    expect(managerMock.findOne).toHaveBeenNthCalledWith(3, Inventory, { where: { productId: dto.productId, locationId: dto.locationId } });
    expect(managerMock.create).toHaveBeenCalledWith(Inventory, {
      productId: dto.productId,
      locationId: dto.locationId,
      storedQuantity: 0,
    });
    expect(managerMock.save).toHaveBeenCalledWith(mockInventory);
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'INVENTORY_CREATED',
      auditableType: 'Inventory',
      auditableId: mockInventory.id,
      userId: user.sub,
    }));
    expect(result).toEqual(mockInventory);
  });

  it('should throw NotFoundException if product not found', async () => {
    const dto = { productId: 999, locationId: 1 };

    const managerMock = { findOne: jest.fn().mockResolvedValueOnce(null) };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    await expect(service.handle(dto, user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException if location not found', async () => {
    const dto = { productId: 1, locationId: 999 };

    const managerMock = {
      findOne: jest.fn()
        .mockResolvedValueOnce(mockProduct) // product exists
        .mockResolvedValueOnce(null),       // location missing
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    await expect(service.handle(dto, user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw ValidationException if inventory already exists', async () => {
    const dto = { productId: 1, locationId: 1 };

    const managerMock = {
      findOne: jest.fn()
        .mockResolvedValueOnce(mockProduct)   // product exists
        .mockResolvedValueOnce(mockLocation)  // location exists
        .mockResolvedValueOnce(mockInventory), // existing inventory
      create: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(async (fn) => fn(managerMock));

    await expect(service.handle(dto, user)).rejects.toBeInstanceOf(ValidationException);
    expect(managerMock.create).not.toHaveBeenCalled();
    expect(managerMock.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});