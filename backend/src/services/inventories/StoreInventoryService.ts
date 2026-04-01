import { inject, injectable } from 'tsyringe';
import { BaseService } from '../BaseService';
import { Inventory } from '@/entities/Inventory';
import { Product } from '@/entities/Product';
import { CreateInventoryMovementService } from '../inventory-movements/CreateInventoryMovementService';
import { CreateAuditLogService } from '../audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { UpdateInventoryDTO } from '@/schemas/inventories/UpdateInventorySchema';
import { ValidationHandler } from '@/lib/ValidationHandler';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { Repository } from 'typeorm';

@injectable()
export class StoreInventoryService implements BaseService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
    
    @inject(CreateInventoryMovementService)
    private readonly createInventoryMovementService: CreateInventoryMovementService,

    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,

    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,
  ) {}

  async handle(
    inventory: Inventory,
    data: UpdateInventoryDTO,
    user?: JwtUserPayload,
  ): Promise<Inventory> {
    const { storedQuantity, notes } = data;

    // Validation for stored quantity must be greater than or equal to 0
    if (storedQuantity == null || storedQuantity < 0) {
      throw new ValidationHandler(
        { field: 'storedQuantity', message: 'Stored quantity must be greater than 0'}
      );
    }

    const product = await this.productRepo.findOne({
      where: { id: inventory.productId },
    });
    if (!product) throw new NotFoundException(`Product not found`);

    // Validation for stored quantity cannot exceed received quantity
    if (storedQuantity > product.receivedQuantity) {
      throw new ValidationHandler(
        { field: 'storedQuantity', message: `Stored quantity (${storedQuantity}) cannot exceed received quantity (${product.receivedQuantity})`}
      );
    }

    const oldInventory = { ...inventory };
    const oldProduct = { ...product };

    // Deduct the storedQuantity from the product's receivedQuantity first
    product.receivedQuantity -= storedQuantity;
    if (product.receivedQuantity < 0) product.receivedQuantity = 0;

    // Save product changes
    await this.productRepo.save(product);

    // Then set the inventory's stored quantity to match the requested amount
    inventory.storedQuantity += storedQuantity;
    const updatedInventory = await this.inventoryRepo.save(inventory);

    await this.createInventoryMovementService.handle({
      productId: null,
      inventoryId: Number(updatedInventory.id),
      fromLocationId: null,
      toLocationId: Number(inventory.locationId ?? null),
      quantity: storedQuantity,
      notes: notes ?? null,
      fromState: InventoryStatus.RECEIVED,
      toState: InventoryStatus.STORED,
    });

    await this.createAuditLogService.handle({
      event: 'INVENTORY_ADD_STORED_QUANTITY',
      description: `Inventory ${updatedInventory.id} for product ${product.sku} set stored quantity to ${storedQuantity}`,
      auditableType: 'Inventory',
      auditableId: updatedInventory.id,
      userId: user?.sub,
      oldValues: oldInventory,
      newValues: { ...updatedInventory },
    });

    await this.createAuditLogService.handle({
      event: 'PRODUCT_UPDATED',
      description: `Product updated with SKU ${product.sku} (received quantity adjusted)`,
      auditableType: 'Product',
      auditableId: product.id,
      userId: user?.sub,
      oldValues: oldProduct,
      newValues: { ...product },
    });

    const updatedInventoryWithRelations = await this.inventoryRepo.findOne({
      where: { id: updatedInventory.id },
      relations: ['product', 'location'],
    });

    if (!updatedInventoryWithRelations) {
      throw new NotFoundException('Inventory not found after update');
    }

    return updatedInventoryWithRelations;
  }
}
