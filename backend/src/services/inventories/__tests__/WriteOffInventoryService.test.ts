import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';

import { WriteOffInventoryService } from '@/services/inventories/WriteOffInventoryService';
import { Inventory } from '@/entities/Inventory';

import { CreateInventoryMovementService } from '@/services/inventory-movements/CreateInventoryMovementService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';

import { InventoryAction } from '@/enums/InventoryAction';
import { InventoryStatus } from '@/enums/InventoryStatus';

import { JwtUserPayload } from '@/types/middlewares/express';

import { NotFoundException } from '@/exceptions/NotFoundException';
import { ValidationException } from '@/exceptions/ValidationException';

describe('WriteOffInventoryService', () => {
  let service: WriteOffInventoryService;
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let movementService: jest.Mocked<CreateInventoryMovementService>;
  let auditService: jest.Mocked<CreateAuditLogService>;

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

  const inventory = {
    id: 1,
    productId: 10,
    locationId: 100,
    storedQuantity: 50,
    product: { id: 10, sku: 'SKU001' },
    location: { id: 100, name: 'Warehouse A' },
  } as unknown as Inventory;

  const makeDTO = (
    quantity: number,
    source?: InventoryAction,
    notes: string | null = null,
  ) => ({
    action: InventoryAction.WRITE_OFF,
    locationId: null,
    storedQuantity: 0,
    reservedQuantity: 0,
    shippedQuantity: 0,
    transferredQuantity: 0,
    writeOffQuantity: quantity,
    writeOffFrom: source,
    notes,
  });

  beforeEach(() => {
    inventoryRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    movementService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateInventoryMovementService>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('InventoryRepository', inventoryRepo);
    container.registerInstance(CreateInventoryMovementService, movementService);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(WriteOffInventoryService);

    jest.clearAllMocks();
  });

  it('should write off inventory successfully', async () => {
    const dto = makeDTO(10, InventoryAction.STORE, 'damaged');

    inventoryRepo.save.mockResolvedValue({ ...inventory, storedQuantity: 40 } as Inventory);

    inventoryRepo.findOne.mockResolvedValue({
      ...inventory,
      storedQuantity: 40,
      product: inventory.product,
      location: inventory.location,
    } as Inventory);

    const result = await service.handle({ ...inventory }, dto, mockUser);

    expect(inventoryRepo.save).toHaveBeenCalled();

    expect(movementService.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryId: 1,
        quantity: 10,
        fromLocationId: 100,
        toLocationId: null,
        fromState: InventoryStatus.STORED,
        toState: InventoryStatus.WRITTEN_OFF,
      }),
    );

    expect(auditService.handle).toHaveBeenCalledTimes(1);

    expect(result.storedQuantity).toBe(40);
  });

  it('should throw ValidationException if writeOffFrom is missing', async () => {
    const dto = makeDTO(10);

    await expect(
      service.handle({ ...inventory }, dto, mockUser),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if writeOffQuantity is invalid', async () => {
    const dto = makeDTO(0, InventoryAction.STORE);

    await expect(
      service.handle({ ...inventory }, dto, mockUser),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if writeOffQuantity exceeds stored quantity', async () => {
    const dto = makeDTO(100, InventoryAction.STORE);

    await expect(
      service.handle({ ...inventory }, dto, mockUser),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException for invalid writeOffFrom source', async () => {
    const dto = makeDTO(10, InventoryAction.TRANSFER);

    await expect(
      service.handle({ ...inventory }, dto, mockUser),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw NotFoundException if inventory not found after update', async () => {
    const dto = makeDTO(10, InventoryAction.STORE);

    inventoryRepo.save.mockResolvedValue({ ...inventory } as Inventory);

    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(
      service.handle({ ...inventory }, dto, mockUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});