import { EntityManager } from 'typeorm';
import { AppDataSource } from '@/data-source';
import { Inventory } from '@/entities/Inventory';
import { Product } from '@/entities/Product';
import { Location } from '@/entities/Location';
import {
  CreateInventoryDTO,
  CreateInventorySchema,
} from '@/schemas/inventories/CreateInventorySchema';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ValidationHandler } from '@/lib/ValidationHandler';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class CreateInventoryService implements BaseService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(
    data: CreateInventoryDTO,
    user?: JwtUserPayload,
  ): Promise<Inventory> {
    const parsedData = await CreateInventorySchema.parseAsync(data);

    return AppDataSource.transaction(async (manager: EntityManager) => {
      const product = await manager.findOne(Product, {
        where: { id: parsedData.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const location = await manager.findOne(Location, {
        where: { id: parsedData.locationId },
      });
      if (!location) {
        throw new NotFoundException('Location not found');
      }

      // Prevent duplicate inventory per product per location
      const existing = await manager.findOne(Inventory, {
        where: {
          productId: parsedData.productId,
          locationId: parsedData.locationId,
        },
      });
      if (existing) {
        throw new ValidationHandler({
          field: 'locationId',
          message: 'Inventory already exists for this product in this location',
        });
      }

      // Create inventory record
      const inventory = manager.create(Inventory, {
        productId: parsedData.productId,
        locationId: parsedData.locationId,
        storedQuantity: 0,
      });

      const saved = await manager.save(inventory);

      // Create audit log
      await this.createAuditLogService.handle({
        event: 'INVENTORY_CREATED',
        description: `Inventory created with product id ${inventory.productId}`,
        auditableType: 'Inventory',
        auditableId: inventory.id,
        userId: user?.sub,
        oldValues: { ...inventory },
      });

      return saved;
    });
  }
}
