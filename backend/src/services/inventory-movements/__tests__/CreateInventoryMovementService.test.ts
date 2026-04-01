import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateInventoryMovementService } from '@/services/inventory-movements/CreateInventoryMovementService';
import { Inventory } from '@/entities/Inventory';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { EntityManager, Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { CreateInventoryMovementDTO } from '@/schemas/inventory-movements/CreateInventoryMovementSchema';

describe('CreateInventoryMovementService', () => {
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let movementRepo: jest.Mocked<Repository<InventoryMovement>>;
  let service: CreateInventoryMovementService;

  const existingInventory: Partial<Inventory> = {
    id: 1,
    productId: 1,
    locationId: 1,
  };

  beforeEach(() => {
    inventoryRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    movementRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<InventoryMovement>>;

    container.registerInstance('InventoryRepository', inventoryRepo);
    container.registerInstance('InventoryMovementRepository', movementRepo);

    service = container.resolve(CreateInventoryMovementService);

    jest.clearAllMocks();
  });

  it('should create an inventory movement when inventoryId is provided and inventory exists', async () => {
    const dto: CreateInventoryMovementDTO = {
      inventoryId: 1,
      productId: 2,
      fromLocationId: null,
      toLocationId: 5,
      quantity: 10,
      fromState: 'received',
      toState: 'stored',
      notes: 'Moved for storage',
    };

    inventoryRepo.findOne.mockResolvedValue(existingInventory as Inventory);

    const createdMovement = { id: 1, ...dto } as InventoryMovement;
    movementRepo.create.mockReturnValue(createdMovement);
    movementRepo.save.mockResolvedValue(createdMovement);

    const result = await service.handle(dto);

    expect(inventoryRepo.findOne).toHaveBeenCalledWith({ where: { id: dto.inventoryId } });
    expect(movementRepo.create).toHaveBeenCalledWith({
      inventoryId: dto.inventoryId,
      productId: dto.productId,
      fromLocationId: dto.fromLocationId,
      toLocationId: dto.toLocationId,
      quantity: dto.quantity,
      fromState: dto.fromState,
      toState: dto.toState,
      notes: dto.notes,
    });
    expect(movementRepo.save).toHaveBeenCalledWith(createdMovement);
    expect(result).toEqual(createdMovement);
  });

  it('should create an inventory movement when inventoryId is null', async () => {
    const dto: CreateInventoryMovementDTO = {
      inventoryId: null,
      productId: 2,
      fromLocationId: null,
      toLocationId: 5,
      quantity: 10,
      fromState: 'received',
      toState: 'stored',
      notes: 'Moved for storage',
    };

    const createdMovement = { id: 1, ...dto } as InventoryMovement;
    movementRepo.create.mockReturnValue(createdMovement);
    movementRepo.save.mockResolvedValue(createdMovement);

    const result = await service.handle(dto);

    // Since inventoryId is null, findOne should NOT be called
    expect(inventoryRepo.findOne).not.toHaveBeenCalled();
    expect(movementRepo.create).toHaveBeenCalledWith({
      inventoryId: null,
      productId: dto.productId,
      fromLocationId: dto.fromLocationId,
      toLocationId: dto.toLocationId,
      quantity: dto.quantity,
      fromState: dto.fromState,
      toState: dto.toState,
      notes: dto.notes,
    });
    expect(movementRepo.save).toHaveBeenCalledWith(createdMovement);
    expect(result).toEqual(createdMovement);
  });

  it('should throw NotFoundException if inventoryId is provided but inventory does not exist', async () => {
    const dto: CreateInventoryMovementDTO = {
      inventoryId: 999,
      productId: 2,
      fromLocationId: null,
      toLocationId: 5,
      quantity: 10,
      fromState: 'received',
      toState: 'stored',
      notes: 'Moved for storage',
    };

    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(dto)).rejects.toThrow(NotFoundException);

    expect(inventoryRepo.findOne).toHaveBeenCalledWith({ where: { id: dto.inventoryId } });
    expect(movementRepo.create).not.toHaveBeenCalled();
    expect(movementRepo.save).not.toHaveBeenCalled();
  });

  it('should use EntityManager repositories if manager is provided', async () => {
    const dto: CreateInventoryMovementDTO = {
      inventoryId: 1,
      productId: 2,
      fromLocationId: null,
      toLocationId: 5,
      quantity: 10,
      fromState: 'received',
      toState: 'stored',
      notes: 'Moved for storage',
    };

    const mockManager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Inventory) return inventoryRepo;
        if (entity === InventoryMovement) return movementRepo;
      }),
    } as unknown as EntityManager;

    inventoryRepo.findOne.mockResolvedValue(existingInventory as Inventory);
    const createdMovement = { id: 1, ...dto } as InventoryMovement;
    movementRepo.create.mockReturnValue(createdMovement);
    movementRepo.save.mockResolvedValue(createdMovement);

    const result = await service.handle(dto, mockManager);

    expect(mockManager.getRepository).toHaveBeenCalledWith(Inventory);
    expect(mockManager.getRepository).toHaveBeenCalledWith(InventoryMovement);
    expect(result).toEqual(createdMovement);
  });
});