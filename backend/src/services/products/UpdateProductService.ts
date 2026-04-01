import { Not, Repository } from 'typeorm';
import { Product } from '@/entities/Product';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  UpdateProductDTO,
  UpdateProductSchema,
} from '@/schemas/products/UpdateProductSchema';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class UpdateProductService implements BaseService {
  constructor(
    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(
    id: number,
    data: UpdateProductDTO,
    user?: JwtUserPayload,
  ): Promise<Product> {
    const parsedData = await UpdateProductSchema.parseAsync(data);

    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const prevProduct = JSON.parse(JSON.stringify(product));

    // Check for SKU uniqueness
    if (parsedData.sku && parsedData.sku !== product.sku) {
      const existing = await this.productRepo.findOne({
        where: {
          sku: parsedData.sku,
          id: Not(product.id),
        },
        withDeleted: true,
      });

      if (existing) {
        throw new ValidationHandler({
          field: 'sku',
          message: 'SKU was already assigned to another product',
        });
      }
    }

    // Update product fields
    product.sku = parsedData.sku;
    product.name = parsedData.name;
    product.description = parsedData.description ?? null;
    product.unitType = parsedData.unitType;

    const savedProduct = await this.productRepo.save(product);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'PRODUCT_UPDATED',
      description: `Product updated with SKU ${product.sku}`,
      auditableType: 'Product',
      auditableId: product.id,
      userId: user?.sub,
      oldValues: prevProduct,
      newValues: { ...parsedData },
    });

    return savedProduct;
  }
}
