import 'reflect-metadata';
import { container } from 'tsyringe';
import { TransferInventoryService } from '@/services/inventories/TransferInventoryService';
import { Inventory } from '@/entities/Inventory';
import { Location } from '@/entities/Location';
import { Repository } from 'typeorm';
import { CreateInventoryMovementService } from '@/services/inventory-movements/CreateInventoryMovementService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { JwtUserPayload } from '@/types/middlewares/express';
import { InventoryAction } from '@/enums/InventoryAction';
import { ValidationException } from '@/exceptions/ValidationException';

describe('TransferInventoryService', () => {
  let service: TransferInventoryService;
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let locationRepo: jest.Mocked<Repository<Location>>;
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
    storedQuantity: 50,
    product: { id: 10, sku: 'SKU001' },
    location: { id: 100, name: 'Old Location' },
  } as unknown as Inventory;

  const mockLocation = {
    id: 200,
    name: 'New Location',
    code: 'LOC002',
    type: 'Warehouse',
    capacity: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Location;

  const makeTransferDTO = (transferredQuantity: number, locationId: number, notes: string | null = null) => ({
    action: InventoryAction.TRANSFER,
    locationId,
    storedQuantity: 0,
    reservedQuantity: 0,
    shippedQuantity: 0,
    transferredQuantity,
    writeOffQuantity: 0,
    notes,
  });

  beforeEach(() => {
    inventoryRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    locationRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Location>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;
    movementService = { handle: jest.fn() } as unknown as jest.Mocked<CreateInventoryMovementService>;

    container.registerInstance('InventoryRepository', inventoryRepo);
    container.registerInstance('LocationRepository', locationRepo);
    container.registerInstance(CreateAuditLogService, auditService);
    container.registerInstance(CreateInventoryMovementService, movementService);

    service = container.resolve(TransferInventoryService);

    jest.clearAllMocks();
  });

  it('should transfer inventory successfully', async () => {
    const data = makeTransferDTO(20, 200, 'Test transfer');

    locationRepo.findOne.mockResolvedValue(mockLocation);

    // Mock findOne calls in sequence
    inventoryRepo.findOne
      .mockResolvedValueOnce(null) // target inventory does not exist
      .mockResolvedValueOnce(null) // withDeleted also none -> forces create()
        .mockResolvedValueOnce({
          ...inventory,
          storedQuantity: 30,
          product: inventory.product,
          location: { id: 100, name: 'Old Location' },
        } as Inventory);

    inventoryRepo.create.mockReturnValue({ ...inventory, locationId: 200, storedQuantity: 20 } as unknown as Inventory);
    inventoryRepo.save.mockResolvedValue({ ...inventory, storedQuantity: 30 } as unknown as Inventory);

    const result = await service.handle(inventory, data, mockUser);

    expect(locationRepo.findOne).toHaveBeenCalledWith({ where: { id: 200 } });
    expect(inventoryRepo.save).toHaveBeenCalled();
    expect(inventoryRepo.create).toHaveBeenCalled();
    expect(movementService.handle).toHaveBeenCalledWith(expect.objectContaining({
      inventoryId: expect.any(Number),
      fromLocationId: 100,
      toLocationId: 200,
      quantity: 20,
      notes: 'Test transfer',
    }));
    expect(auditService.handle).toHaveBeenCalledTimes(2);
    expect(result.storedQuantity).toBe(30);
  });

  it('should throw NotFoundException if target location does not exist', async () => {
    const data = makeTransferDTO(10, 999);
    locationRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(inventory, data, mockUser)).rejects.toBeInstanceOf(NotFoundException);
  });
  
  it('should throw ValidationException if transferredQuantity is invalid', async () => {
    const data = makeTransferDTO(-5, 200);

    locationRepo.findOne.mockResolvedValue(mockLocation);

    await expect(
      service.handle(inventory, data, mockUser)
    ).rejects.toBeInstanceOf(ValidationException);

    expect(inventoryRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if transferredQuantity exceeds storedQuantity', async () => {
    const data = makeTransferDTO(100, 200);
    locationRepo.findOne.mockResolvedValue(mockLocation);

    await expect(service.handle(inventory, data, mockUser)).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if locationId is invalid', async () => {
    const data = makeTransferDTO(10, 0);

    await expect(
      service.handle(inventory, data, mockUser)
    ).rejects.toBeInstanceOf(ValidationException);

    expect(locationRepo.findOne).not.toHaveBeenCalled();
  });

  it('should increase storedQuantity if target inventory already exists', async () => {
    const data = makeTransferDTO(10, 200);

    locationRepo.findOne.mockResolvedValue(mockLocation);

    inventoryRepo.findOne
      .mockResolvedValueOnce({ ...inventory, locationId: 200, storedQuantity: 5 } as Inventory) // existing target
      .mockResolvedValueOnce({
        ...inventory,
        storedQuantity: 40,
        product: inventory.product,
        location: inventory.location
      } as Inventory);

    inventoryRepo.save.mockResolvedValue({ ...inventory } as Inventory);

    await service.handle(inventory, data, mockUser);

    expect(inventoryRepo.save).toHaveBeenCalledTimes(2);
  });

  it('should restore soft deleted inventory during transfer', async () => {
    const data = makeTransferDTO(10, 200);

    locationRepo.findOne.mockResolvedValue(mockLocation);

    inventoryRepo.findOne
      .mockResolvedValueOnce(null) // no active inventory
      .mockResolvedValueOnce({
        id: 2,
        productId: 10,
        locationId: 200,
        storedQuantity: 0,
        deletedAt: new Date()
      } as Inventory)
      .mockResolvedValueOnce({
        ...inventory,
        product: inventory.product,
        location: inventory.location
      } as Inventory);

    inventoryRepo.save.mockResolvedValue({ ...inventory } as Inventory);

    await service.handle(inventory, data, mockUser);

    expect(inventoryRepo.save).toHaveBeenCalled();
  });
});