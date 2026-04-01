import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';

import { UpdateInventoryService } from '@/services/inventories/UpdateInventoryService';
import { Inventory } from '@/entities/Inventory';
import { AppDataSource } from '@/data-source';

import { StoreInventoryService } from '@/services/inventories/StoreInventoryService';
import { TransferInventoryService } from '@/services/inventories/TransferInventoryService';
import { WriteOffInventoryService } from '@/services/inventories/WriteOffInventoryService';

import { InventoryAction } from '@/enums/InventoryAction';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BadRequestException } from '@/exceptions/BadRequestException';

import { UpdateInventoryDTO } from '@/schemas/inventories/UpdateInventorySchema';
import { JwtUserPayload } from '@/types/middlewares/express';

describe('UpdateInventoryService', () => {
  let service: UpdateInventoryService;

  let inventoryRepo: jest.Mocked<Repository<Inventory>>;

  let storeService: jest.Mocked<StoreInventoryService>;
  let transferService: jest.Mocked<TransferInventoryService>;
  let writeOffService: jest.Mocked<WriteOffInventoryService>;

  const inventory = {
    id: 1,
    product: { id: 10 },
    location: { id: 100 },
  } as unknown as Inventory;

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

  const makeDTO = (action: InventoryAction): UpdateInventoryDTO => ({
    action,
    locationId: null,
    storedQuantity: 0,
    reservedQuantity: 0,
    shippedQuantity: 0,
    transferredQuantity: 0,
    writeOffQuantity: 0,
    notes: null,
  });

  beforeEach(() => {
    inventoryRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(inventoryRepo);

    storeService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<StoreInventoryService>;

    transferService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<TransferInventoryService>;

    writeOffService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<WriteOffInventoryService>;

    container.registerInstance(StoreInventoryService, storeService);
    container.registerInstance(TransferInventoryService, transferService);
    container.registerInstance(WriteOffInventoryService, writeOffService);

    service = container.resolve(UpdateInventoryService);

    jest.clearAllMocks();
  });

  it('should throw NotFoundException if inventory does not exist', async () => {
    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(
      service.handle(1, makeDTO(InventoryAction.STORE), mockUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should call StoreInventoryService for STORE action', async () => {
    inventoryRepo.findOne.mockResolvedValue(inventory);
    storeService.handle.mockResolvedValue(inventory);

    const dto = makeDTO(InventoryAction.STORE);

    const result = await service.handle(1, dto, mockUser);

    expect(storeService.handle).toHaveBeenCalledWith(inventory, dto, mockUser);
    expect(result).toBe(inventory);
  });

  it('should call TransferInventoryService for TRANSFER action', async () => {
    inventoryRepo.findOne.mockResolvedValue(inventory);
    transferService.handle.mockResolvedValue(inventory);

    const dto = makeDTO(InventoryAction.TRANSFER);

    const result = await service.handle(1, dto, mockUser);

    expect(transferService.handle).toHaveBeenCalledWith(inventory, dto, mockUser);
    expect(result).toBe(inventory);
  });

  it('should call WriteOffInventoryService for WRITE_OFF action', async () => {
    inventoryRepo.findOne.mockResolvedValue(inventory);
    writeOffService.handle.mockResolvedValue(inventory);

    const dto = makeDTO(InventoryAction.WRITE_OFF);

    const result = await service.handle(1, dto, mockUser);

    expect(writeOffService.handle).toHaveBeenCalledWith(inventory, dto, mockUser);
    expect(result).toBe(inventory);
  });

  it('should throw BadRequestException for invalid action', async () => {
    inventoryRepo.findOne.mockResolvedValue(inventory);

    const invalidDTO = {
      ...makeDTO(InventoryAction.STORE),
      action: 'INVALID',
    } as unknown as UpdateInventoryDTO;

    await expect(
      service.handle(1, invalidDTO, mockUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});