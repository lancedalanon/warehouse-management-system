import { Repository } from 'typeorm';
import { Product } from '@/entities/Product';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { PaginationRequest } from '@/types/pagination/pagination.types';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

const SORT_COLUMNS = {
  id: 'product.id',
  sku: 'product.sku',
  name: 'product.name',
  unitType: 'product.unitType',
  createdAt: 'product.createdAt',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetProductsService implements BaseService {
  constructor(
    @inject('ProductRepository')
    private readonly productRepo: Repository<Product>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<Product> & {
      search?: string;
      sortBy?: SortKey;
    };

    const page = query.page ?? 1;
    const limit = Math.min(Number(query.limit) || 10, 100);

    const sortKey =
      query.sortBy && query.sortBy in SORT_COLUMNS ? query.sortBy : 'id';

    const sortColumn = SORT_COLUMNS[sortKey];
    const sortDirection: 'ASC' | 'DESC' =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.productRepo.createQueryBuilder('product');

    // Filters
    if (query.id) qb.andWhere('product.id = :id', { id: Number(query.id) });
    if (query.sku)
      qb.andWhere('product.sku ILIKE :sku', { sku: `%${query.sku}%` });
    if (query.name)
      qb.andWhere('product.name ILIKE :name', { name: `%${query.name}%` });
    if (query.unitType)
      qb.andWhere('product.unit_type ILIKE :unitType', {
        unitType: `%${query.unitType}%`,
      });

    // Global search
    if (query.search) {
      qb.andWhere(
        `
        (
          product.sku ILIKE :search
          OR product.name ILIKE :search
          OR product.unit_type ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [products, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(products, totalCount, page, limit).getResult();
  }
}
