import { Repository } from 'typeorm';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { PaginationRequest } from '@/types/pagination/pagination.types';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

const SORT_COLUMNS = {
  quantity: 'movement.quantity',
  fromLocation: 'fromLocation.name',
  toLocation: 'toLocation.name',
  createdAt: 'movement.createdAt',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetInventoryMovementsService implements BaseService {
  constructor(
    @inject('InventoryMovementRepository')
    private readonly movementRepo: Repository<InventoryMovement>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<InventoryMovement> & {
      search?: string;
      sortBy?: SortKey;
    };

    const page = query.page ?? 1;
    const limit = Math.min(Number(query.limit) || 10, 100);

    const sortKey =
      query.sortBy && query.sortBy in SORT_COLUMNS ? query.sortBy : 'createdAt';
    const sortColumn = SORT_COLUMNS[sortKey];
    const sortDirection: 'ASC' | 'DESC' =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.movementRepo
      .createQueryBuilder('movement')
      .leftJoinAndSelect(
        'movement.inventory',
        'inventory',
        'inventory.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'inventory.product',
        'product',
        'product.deletedAt IS NULL',
      )
      .leftJoinAndSelect('movement.fromLocation', 'fromLocation')
      .leftJoinAndSelect(
        'movement.toLocation',
        'toLocation',
        'toLocation.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        'movement.product',
        'movementProduct',
        'movementProduct.deletedAt IS NULL',
      ).andWhere(`
        (
          (LOWER(movement.toState) = 'received' AND movementProduct.id IS NOT NULL)

          OR (LOWER(movement.toState) = 'stored'
              AND inventory.id IS NOT NULL
              AND toLocation.id IS NOT NULL)

          OR (LOWER(movement.toState) = 'reserved'
              AND inventory.id IS NOT NULL
              AND toLocation.id IS NOT NULL)

          OR (LOWER(movement.toState) IN ('shipped', 'written-off')
              AND inventory.id IS NOT NULL
              AND fromLocation.id IS NOT NULL)

          OR (LOWER(movement.toState) = 'transferred'
              AND inventory.id IS NOT NULL
              AND toLocation.id IS NOT NULL)
        )
      `);

    // Filters
    if (query.id) qb.andWhere('movement.id = :id', { id: Number(query.id) });
    if (query.inventoryId)
      qb.andWhere('movement.inventoryId = :inventoryId', {
        inventoryId: Number(query.inventoryId),
      });
    if (query.fromState)
      qb.andWhere('movement.fromState ILIKE :fromState', {
        fromState: `%${query.fromState}%`,
      });
    if (query.toState)
      qb.andWhere('movement.toState ILIKE :toState', {
        toState: `%${query.toState}%`,
      });
    if (query.fromLocationId)
      qb.andWhere('movement.fromLocationId = :fromLocationId', {
        fromLocationId: Number(query.fromLocationId),
      });
    if (query.toLocationId)
      qb.andWhere('movement.toLocationId = :toLocationId', {
        toLocationId: Number(query.toLocationId),
      });

    // Global search
    if (query.search) {
      qb.andWhere(
        `
        (
          movement.type ILIKE :search
          OR product.name ILIKE :search
          OR fromLocation.name ILIKE :search
          OR toLocation.name ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [movements, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(movements, totalCount, page, limit).getResult();
  }
}
