import { Inventory } from '@/entities/Inventory';
import { Repository } from 'typeorm/repository/Repository';
import { CreateInventoryMovementService } from '../inventory-movements/CreateInventoryMovementService';
import { CreateAuditLogService } from '../audit-logs/CreateAuditLogService';
import { UpdateInventoryDTO } from '@/schemas/inventories/UpdateInventorySchema';
import { JwtUserPayload } from '@/types/middlewares/express';
import { ValidationHandler } from '@/lib/ValidationHandler';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { inject, injectable } from 'tsyringe';
import { Location } from '@/entities/Location';
import { NotFoundException } from '@/exceptions/NotFoundException';

@injectable()
export class TransferInventoryService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,

    @inject(CreateInventoryMovementService)
    private readonly createInventoryMovementService: CreateInventoryMovementService,

    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,

    @inject('LocationRepository')
    private readonly locationRepo: Repository<Location>,
  ) {}

  async handle(
    inventory: Inventory,
    data: UpdateInventoryDTO,
    user?: JwtUserPayload,
  ): Promise<Inventory> {
    const { locationId, transferredQuantity, notes } = data;

    if (!locationId || locationId <= 0) {
      throw new ValidationHandler({
        field: 'locationId',
        message: 'Target location is required for transfer',
      });
    }

    // Validate that target location exists
    const location = await this.locationRepo.findOne({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Location with ID ${locationId} does not exist`,
      );
    }

    if (!transferredQuantity || transferredQuantity <= 0) {
      throw new ValidationHandler({
        field: 'transferredQuantity',
        message: 'Transferred quantity must be greater than 0',
      });
    }

    if (transferredQuantity > inventory.storedQuantity) {
      throw new ValidationHandler({
        field: 'transferredQuantity',
        message: `Transferred quantity (${transferredQuantity}) cannot exceed stored quantity (${inventory.storedQuantity})`,
      });
    }

    // Update old source to decrease quantity
    const oldSource = { ...inventory };
    inventory.storedQuantity -= transferredQuantity;
    if (inventory.storedQuantity < 0) inventory.storedQuantity = 0;

    const updatedSource = await this.inventoryRepo.save(inventory);

    // Update or create the target inventory
    const productId = inventory.productId;

    // Find target inventory BEFORE update
    let targetInventory = await this.inventoryRepo.findOne({
      where: { productId, locationId },
    });

    const oldTarget = targetInventory ? { ...targetInventory } : null;

    // If it exists, increment stock; else create new row
    if (targetInventory) {
      targetInventory.storedQuantity += transferredQuantity;
      await this.inventoryRepo.save(targetInventory);
    } else {
      // Check if the inventory unit has been soft deleted
      targetInventory = await this.inventoryRepo.findOne({
        where: { productId, locationId },
        withDeleted: true,
      });

      if (targetInventory) {
        // Restore and update quantity
        targetInventory.storedQuantity = transferredQuantity;
        targetInventory.deletedAt = null;
        await this.inventoryRepo.save(targetInventory);
      } else {
        // Create new inventory unit
        targetInventory = this.inventoryRepo.create({
          productId,
          locationId,
          storedQuantity: transferredQuantity,
        });
        await this.inventoryRepo.save(targetInventory);
      }
    }

    await this.createInventoryMovementService.handle({
      productId: null,
      inventoryId: Number(targetInventory.id),
      fromLocationId: Number(inventory.locationId ?? null),
      toLocationId: Number(locationId),
      quantity: transferredQuantity,
      notes: notes ?? null,
      fromState: InventoryStatus.STORED,
      toState: InventoryStatus.TRANSFERRED,
    });

    await this.createAuditLogService.handle({
      event: 'INVENTORY_TRANSFERRED',
      description: `Transferred ${transferredQuantity} units of product ${inventory.product.sku} from location ${inventory.locationId} to ${locationId}`,
      auditableType: 'Inventory',
      auditableId: updatedSource.id,
      userId: user?.sub,
      oldValues: oldSource,
      newValues: { ...updatedSource },
    });

    await this.createAuditLogService.handle({
      event: 'INVENTORY_TRANSFERRED',
      description: `Received ${transferredQuantity} units of product ${inventory.product.sku} at location ${locationId}`,
      auditableType: 'Inventory',
      auditableId: targetInventory.id,
      userId: user?.sub,
      oldValues: oldTarget,
      newValues: { ...targetInventory },
    });

    const updatedInventoryWithRelations = await this.inventoryRepo.findOne({
      where: { id: updatedSource.id },
      relations: ['product', 'location'],
    });

    if (!updatedInventoryWithRelations) {
      throw new NotFoundException('Inventory not found after update');
    }

    return updatedInventoryWithRelations;
  }
}
