import { Repository } from 'typeorm';
import { Product } from '@/entities/Product';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class GetProductService implements BaseService {
  constructor(
    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,
  ) {}

  async handle(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }
}
