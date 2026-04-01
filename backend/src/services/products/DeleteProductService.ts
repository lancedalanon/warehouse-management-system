import { Repository } from 'typeorm';
import { Product } from '@/entities/Product';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class DeleteProductService implements BaseService {
  constructor(
    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(id: number, user?: JwtUserPayload): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    await this.productRepo.softRemove(product);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'PRODUCT_DELETED',
      description: `Product deleted with SKU ${product.sku}`,
      auditableType: 'Product',
      auditableId: product.id,
      userId: user?.sub,
      oldValues: { ...product },
    });

    return product;
  }
}
