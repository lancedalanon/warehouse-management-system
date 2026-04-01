import 'reflect-metadata';
import { container } from 'tsyringe';
import { StoreInventoryService } from '@/services/inventories/StoreInventoryService';
import { Inventory } from '@/entities/Inventory';
import { Product } from '@/entities/Product';
import { Repository } from 'typeorm';
import { CreateInventoryMovementService } from '@/services/inventory-movements/CreateInventoryMovementService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { JwtUserPayload } from '@/types/middlewares/express';
import { InventoryAction } from '@/enums/InventoryAction';
import { ValidationException } from '@/exceptions/ValidationException';

describe('StoreInventoryService', () => {
  let service: StoreInventoryService;
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let movementService: jest.Mocked<CreateInventoryMovementService>;

  const mockUser: JwtUserPayload = {
    sub: 1,
    email: 'user@example.com',
    roles: [],
    emailVerifiedAt: null,
    firstName: 'Test',
    lastName: 'User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'test-issuer',
    aud: 'test-audience',
  };

  const inventory = {
    id: 1,
    productId: 10,
    locationId: 100,
    storedQuantity: 0,
  } as Inventory;

  const product = {
    id: 10,
    sku: 'SKU001',
    receivedQuantity: 50,
  } as Product;

  beforeEach(() => {
    inventoryRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    productRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    movementService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateInventoryMovementService>;

    container.registerInstance('InventoryRepository', inventoryRepo);
    container.registerInstance('ProductRepository', productRepo);
    container.registerInstance(CreateAuditLogService, auditService);
    container.registerInstance(CreateInventoryMovementService, movementService);

    service = container.resolve(StoreInventoryService);

    jest.clearAllMocks();
  });

  const makeDTO = (storedQuantity: number, notes: string | null = null) => ({
    action: InventoryAction.STORE,
    locationId: inventory.locationId ?? null,
    storedQuantity,
    reservedQuantity: 0,
    shippedQuantity: 0,
    transferredQuantity: 0,
    writeOffQuantity: 0,
    notes,
  });

  it('should store inventory successfully and update product received quantity', async () => {
    const data = makeDTO(10, 'Test note');
    // Mock Location as a full entity for testing
    const mockLocation = {
        id: 100,
        name: 'Location',
        code: 'LOC001',
        type: 'Warehouse',
        capacity: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as unknown as Location; // cast entire object

    // Mock the product repository
    productRepo.findOne.mockResolvedValue(product);
    productRepo.save.mockResolvedValue({ ...product, receivedQuantity: 40 });

    // Mock the inventory repository
    inventoryRepo.save.mockResolvedValue({ ...inventory, storedQuantity: 10 });
    inventoryRepo.findOne.mockResolvedValue({
        ...inventory,
        storedQuantity: 10,
        product,
        location: mockLocation,
    } as unknown as Inventory);

    const result = await service.handle(inventory, data, mockUser);

    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: inventory.productId } });
    expect(productRepo.save).toHaveBeenCalledWith({ ...product, receivedQuantity: 40 });
    expect(inventoryRepo.save).toHaveBeenCalledWith({ ...inventory, storedQuantity: 10 });

    expect(movementService.handle).toHaveBeenCalledWith(expect.objectContaining({
      inventoryId: 1,
      quantity: 10,
      fromState: InventoryStatus.RECEIVED,
      toState: InventoryStatus.STORED,
    }));

    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'INVENTORY_ADD_STORED_QUANTITY',
      auditableId: 1,
      userId: mockUser.sub,
    }));

    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'PRODUCT_UPDATED',
      auditableId: product.id,
      userId: mockUser.sub,
    }));

    expect(result.storedQuantity).toBe(10);
  });

  it('should throw ValidationException if storedQuantity is negative', async () => {
    const data = makeDTO(-5);

    await expect(service.handle(inventory, data, mockUser)).rejects.toBeInstanceOf(ValidationException);

    expect(productRepo.findOne).not.toHaveBeenCalled();
    expect(inventoryRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if product not found', async () => {
    const data = makeDTO(5);

    productRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(inventory, data, mockUser)).rejects.toBeInstanceOf(NotFoundException);

    expect(productRepo.save).not.toHaveBeenCalled();
    expect(inventoryRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if storedQuantity exceeds product receivedQuantity', async () => {
    const data = makeDTO(100); // exceeds product.receivedQuantity of 50
    productRepo.findOne.mockResolvedValue(product);

    await expect(service.handle(inventory, data, mockUser)).rejects.toBeInstanceOf(ValidationException);

    expect(inventoryRepo.save).not.toHaveBeenCalled();
    expect(productRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if inventory not found after update', async () => {
    const data = makeDTO(5);

    inventoryRepo.save.mockResolvedValue({ ...inventory, storedQuantity: 5 });
    productRepo.findOne.mockResolvedValue(product);
    productRepo.save.mockResolvedValue({ ...product, receivedQuantity: 45 });
    inventoryRepo.findOne.mockResolvedValue(null); // simulate missing inventory after save

    await expect(service.handle(inventory, data, mockUser)).rejects.toBeInstanceOf(NotFoundException);
  });
});