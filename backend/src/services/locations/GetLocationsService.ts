import { Repository } from 'typeorm';
import { Location } from '@/entities/Location';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { PaginationRequest } from '@/types/pagination/pagination.types';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

const SORT_COLUMNS = {
  id: 'location.id',
  code: 'location.code',
  name: 'location.name',
  type: 'location.type',
  createdAt: 'location.createdAt',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetLocationsService implements BaseService {
  constructor(
    @inject('LocationRepository')
    private readonly locationRepo: Repository<Location>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<Location> & {
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

    const qb = this.locationRepo.createQueryBuilder('location');

    // Filters
    if (query.id) qb.andWhere('location.id = :id', { id: Number(query.id) });
    if (query.code)
      qb.andWhere('location.code ILIKE :code', { code: `%${query.code}%` });
    if (query.name)
      qb.andWhere('location.name ILIKE :name', { name: `%${query.name}%` });
    if (query.type)
      qb.andWhere('location.type ILIKE :type', { type: `%${query.type}%` });

    // Global search
    if (query.search) {
      qb.andWhere(
        `
        (
          location.code ILIKE :search
          OR location.name ILIKE :search
          OR location.type ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [locations, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(locations, totalCount, page, limit).getResult();
  }
}
