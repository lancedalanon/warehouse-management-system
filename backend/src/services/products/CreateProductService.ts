import { Repository } from 'typeorm';
import { Product } from '@/entities/Product';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  CreateProductDTO,
  CreateProductSchema,
} from '@/schemas/products/CreateProductSchema';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { CreateInventoryMovementService } from '../inventory-movements/CreateInventoryMovementService';

@injectable()
export class CreateProductService implements BaseService {
  constructor(
    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,

    @inject(CreateInventoryMovementService)
    private readonly createInventoryMovementService: CreateInventoryMovementService,
  ) {}

  async handle(
    data: CreateProductDTO,
    user?: JwtUserPayload,
  ): Promise<Product> {
    const parsedData = await CreateProductSchema.parseAsync(data);

    // Check for existing SKU
    const existing = await this.productRepo.findOne({
      where: { sku: parsedData.sku },
      withDeleted: true,
    });

    if (existing) {
      throw new ValidationHandler({
        field: 'sku',
        message: 'SKU was already assigned to another product',
      });
    }

    // Create and save the new product
    const product = this.productRepo.create({
      sku: parsedData.sku,
      name: parsedData.name,
      description: parsedData.description ?? null,
      unitType: parsedData.unitType,
      receivedQuantity: parsedData.receivedQuantity,
    });

    const savedProduct = await this.productRepo.save(product);

    // Create initial inventory movement for received quantity
    await this.createInventoryMovementService.handle({
      productId: Number(savedProduct.id),
      inventoryId: null,
      fromLocationId: null,
      toLocationId: null,
      quantity: parsedData.receivedQuantity,
      notes: null,
      fromState: InventoryStatus.EXTERNAL,
      toState: InventoryStatus.RECEIVED,
    });

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'PRODUCT_CREATED',
      description: `Product created with SKU ${savedProduct.sku}`,
      auditableType: 'Product',
      auditableId: savedProduct.id,
      userId: user?.sub,
      oldValues: null,
      newValues: { ...savedProduct },
    });

    return savedProduct;
  }
}
