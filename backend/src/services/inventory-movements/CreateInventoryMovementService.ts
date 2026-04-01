import { EntityManager, Repository } from 'typeorm';
import { Inventory } from '@/entities/Inventory';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { NotFoundException } from '@/exceptions/NotFoundException';
import {
  CreateInventoryMovementDTO,
  CreateInventoryMovementSchema,
} from '@/schemas/inventory-movements/CreateInventoryMovementSchema';

@injectable()
export class CreateInventoryMovementService implements BaseService {
  constructor(
    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,

    @inject('InventoryMovementRepository')
    private readonly movementRepo: Repository<InventoryMovement>,
  ) {}

  async handle(
    data: CreateInventoryMovementDTO,
    manager?: EntityManager,
  ): Promise<InventoryMovement> {
    const parsedData = CreateInventoryMovementSchema.parse(data);

    const inventoryRepo = manager
      ? manager.getRepository(Inventory)
      : this.inventoryRepo;
    const movementRepo = manager
      ? manager.getRepository(InventoryMovement)
      : this.movementRepo;

    if (parsedData.inventoryId !== null) {
      const inventory = await inventoryRepo.findOne({
        where: { id: parsedData.inventoryId },
      });
      if (!inventory) {
        throw new NotFoundException('Inventory not found');
      }
    }

    const movement = movementRepo.create({
      inventoryId: parsedData.inventoryId ?? null,
      productId: parsedData.productId ?? null,
      fromLocationId: parsedData.fromLocationId ?? null,
      toLocationId: parsedData.toLocationId ?? null,
      quantity: parsedData.quantity,
      notes: parsedData.notes ?? null,
      fromState: parsedData.fromState,
      toState: parsedData.toState,
    });

    return await movementRepo.save(movement);
  }
}