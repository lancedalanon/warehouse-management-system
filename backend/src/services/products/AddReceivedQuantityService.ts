import { NotFoundException } from '@/exceptions/NotFoundException';
import {
  AddReceivedQuantityDTO,
  AddReceivedQuantitySchema,
} from '@/schemas/products/AddReceivedQuantitySchema';
import { JwtUserPayload } from '@/types/middlewares/express';
import { CreateAuditLogService } from '../audit-logs/CreateAuditLogService';
import { Product } from '@/entities/Product';
import { inject, injectable } from 'tsyringe';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { CreateInventoryMovementService } from '../inventory-movements/CreateInventoryMovementService';
import { Repository } from 'typeorm';

@injectable()
export class AddReceivedQuantityService {
  constructor(
    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,

    @inject(CreateInventoryMovementService)
    private readonly createInventoryMovementService: CreateInventoryMovementService,
  ) {}

  async handle(
    productId: number,
    data: AddReceivedQuantityDTO,
    user?: JwtUserPayload,
  ) {
    const parsed = AddReceivedQuantitySchema.parse(data);

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const oldValues = { ...product };

    // Append received quantity
    product.receivedQuantity += parsed.quantity;

    const updatedProduct = await this.productRepo.save(product);

    // Create inventory movement for received quantity
    await this.createInventoryMovementService.handle({
      productId: Number(updatedProduct.id),
      inventoryId: null,
      fromLocationId: null,
      toLocationId: null,
      quantity: parsed.quantity,
      notes: null,
      fromState: InventoryStatus.EXTERNAL,
      toState: InventoryStatus.RECEIVED,
    });

    // Audit log
    await this.createAuditLogService.handle({
      event: 'PRODUCT_RECEIVED',
      description: `Product ${updatedProduct.sku} received ${parsed.quantity} units`,
      auditableType: 'Product',
      auditableId: updatedProduct.id,
      userId: user?.sub,
      oldValues,
      newValues: { ...updatedProduct },
    });

    return updatedProduct;
  }
}
