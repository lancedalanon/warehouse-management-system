import { Repository } from 'typeorm';
import { inject, injectable } from 'tsyringe';
import { Order } from '@/entities/Order';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';

const SORT_COLUMNS = {
  id: 'order.id',
  code: 'order.code',
  status: 'order.status',
  createdAt: 'order.createdAt',
  updatedAt: 'order.updatedAt',
  recipientName: 'order.recipientName',
  priorityLevel: 'order.priorityLevel',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetOrdersService implements BaseService {
  constructor(
    @inject('OrderRepository')
    private readonly orderRepo: Repository<Order>,
  ) {}

  async handle(req: Request) {
    const query = req.query as {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: SortKey;
      sortDirection?: 'ASC' | 'DESC';
      id?: number;
      code?: string;
      status?: string;
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const sortKey =
      query.sortBy && query.sortBy in SORT_COLUMNS ? query.sortBy : 'id';
    const sortColumn = SORT_COLUMNS[sortKey];
    const sortDirection: 'ASC' | 'DESC' =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .andWhere('order.id IS NOT NULL');

    // Filters
    if (query.id) qb.andWhere('order.id = :id', { id: Number(query.id) });
    if (query.code)
      qb.andWhere('order.code ILIKE :code', { code: `%${query.code}%` });
    if (query.status)
      qb.andWhere('order.status = :status', { status: query.status });

    // Global search
    if (query.search) {
      qb.andWhere(
        `(
          order.code ILIKE :search
          OR order.status ILIKE :search
          OR order.recipientName ILIKE :search
          OR order.shippingAddress ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(orders, totalCount, page, limit).getResult();
  }
}
