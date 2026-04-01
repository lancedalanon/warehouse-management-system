import { inject, injectable } from 'tsyringe';
import { BaseService } from '../BaseService';
import { Inventory } from '@/entities/Inventory';
import { CreateInventoryMovementService } from '../inventory-movements/CreateInventoryMovementService';
import { CreateAuditLogService } from '../audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { UpdateInventoryDTO } from '@/schemas/inventories/UpdateInventorySchema';
import { ValidationHandler } from '@/lib/ValidationHandler';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { InventoryAction } from '@/enums/InventoryAction';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { Repository } from 'typeorm';

@injectable()
export class WriteOffInventoryService implements BaseService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
    
    @inject(CreateInventoryMovementService)
    private readonly createInventoryMovementService: CreateInventoryMovementService,

    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  async handle(
    inventory: Inventory,
    data: UpdateInventoryDTO,
    user?: JwtUserPayload,
  ): Promise<Inventory> {
    const { writeOffQuantity, writeOffFrom, notes } = data;

    // Schema already enforces this, but we still guard for safety
    if (!writeOffFrom) {
      throw new ValidationHandler(
        { field: 'writeOffFrom', message: 'Source of write-off is required'},
      );
    }

    if (!writeOffQuantity || writeOffQuantity <= 0) {
      throw new ValidationHandler(
        { field: 'writeOffQuantity', message: 'Write-off quantity must be greater than 0'},
      );
    }

    const oldInventory = { ...inventory };

    /**
     * Determine which field to deduct from
     */
    let sourceValue = 0;
    let deduct = () => {};

    switch (writeOffFrom) {
      case InventoryAction.STORE:
        sourceValue = inventory.storedQuantity;
        deduct = () => (inventory.storedQuantity -= writeOffQuantity);
        break;

      default:
        throw new ValidationHandler(
          { field: 'writeOffFrom', message: 'Invalid source for write-off'},
        );
    }

    if (writeOffQuantity > sourceValue) {
      throw new ValidationHandler(
        { field: 'writeOffQuantity', message: `Cannot write off more than ${writeOffFrom.toLowerCase()} quantity (${sourceValue})`},
      );
    }

    // Deduct from the selected inventory bucket
    deduct();

    await this.inventoryRepo.save(inventory);

    // Inventory movement record
    await this.createInventoryMovementService.handle({
      productId: null,
      inventoryId: Number(inventory.id),
      fromLocationId: Number(inventory.locationId ?? null),
      toLocationId: null,
      quantity: writeOffQuantity,
      notes: notes ?? null,
      fromState: this.actionToState(writeOffFrom),
      toState: InventoryStatus.WRITTEN_OFF,
    });

    // Audit logs
    await this.createAuditLogService.handle({
      event: 'INVENTORY_WRITTEN_OFF',
      description: `Inventory ${inventory.id} wrote off ${writeOffQuantity} units from ${writeOffFrom}`,
      auditableType: 'Inventory',
      auditableId: inventory.id,
      userId: user?.sub,
      oldValues: oldInventory,
      newValues: { ...inventory },
    });

    const updatedInventoryWithRelations = await this.inventoryRepo.findOne({
      where: { id: inventory.id },
      relations: ['product', 'location'],
    });

    if (!updatedInventoryWithRelations) {
      throw new NotFoundException('Inventory not found after update');
    }

    return updatedInventoryWithRelations;
  }

  private actionToState(action: InventoryAction): InventoryStatus {
    switch (action) {
      case InventoryAction.STORE:
        return InventoryStatus.STORED;
      default:
        throw new ValidationHandler(
          { field: 'writeOffFrom', message: 'Invalid source for write-off'},
        );
    }
  }
}
