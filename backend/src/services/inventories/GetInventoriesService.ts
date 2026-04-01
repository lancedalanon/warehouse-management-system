import { Repository } from 'typeorm';
import { Inventory } from '@/entities/Inventory';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { InventoryPaginationRequest } from '@/types/services/dashboard/inventory.types';

const SORT_COLUMNS = {
  id: 'inventory.id',
  productName: 'product.name',
  productSku: 'product.sku',
  locationName: 'location.name',
  locationCode: 'location.code',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetInventoriesService implements BaseService {
  constructor(
    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  async handle(req: Request) {
    const query = req.query as InventoryPaginationRequest & {
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

    const productIds = (query.productIds ?? []).map(Number);
    const locationIds = (query.locationIds ?? []).map(Number);

    const qb = this.inventoryRepo
      .createQueryBuilder('inventory')
      .leftJoinAndSelect(
        'inventory.product',
        'product',
        'product.deletedAt IS NULL',
      )
      .leftJoinAndSelect('inventory.location', 'location')
      .andWhere('product.id IS NOT NULL');

    // Filters
    if (query.id) qb.andWhere('inventory.id = :id', { id: Number(query.id) });
    if (query.productId)
      qb.andWhere('inventory.productId = :productId', {
        productId: Number(query.productId),
      });
    if (query.locationId)
      qb.andWhere('inventory.locationId = :locationId', {
        locationId: Number(query.locationId),
      });
    if (productIds.length)
      qb.andWhere('inventory.productId IN (:...productIds)', { productIds });
    if (locationIds.length)
      qb.andWhere('inventory.locationId IN (:...locationIds)', { locationIds });

    // Global search
    if (query.search) {
      qb.andWhere(
        `
          (
            product.name ILIKE :search
            OR product.sku ILIKE :search
            OR location.name ILIKE :search
            OR location.code ILIKE :search
          )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [inventories, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(
      inventories,
      totalCount,
      page,
      limit,
    ).getResult();
  }
}
