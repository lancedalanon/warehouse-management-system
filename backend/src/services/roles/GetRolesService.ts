import { Repository } from 'typeorm';
import { Role } from '@/entities/Role';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { Role as RoleEnum } from '@/enums/Role';
import { PaginationRequest } from '@/types/pagination/pagination.types';

const SORT_COLUMNS = {
  id: 'role.id',
  name: 'role.name',
  code: 'role.code',
  createdAt: 'role.createdAt',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetRolesService implements BaseService {
  constructor(
    @inject('RoleRepository')
    private readonly roleRepo: Repository<Role>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<Role> & {
      search?: string;
      sortBy?: SortKey;
    };

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);

    // Safe Sorting logic
    const sortKey =
      query.sortBy && query.sortBy in SORT_COLUMNS ? query.sortBy : 'id';
    const sortColumn = SORT_COLUMNS[sortKey];
    const sortDirection: 'ASC' | 'DESC' =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.roleRepo.createQueryBuilder('role');

    // Always exclude Superadmin from the list
    qb.where('role.code != :superadminCode', {
      superadminCode: RoleEnum.SUPERADMIN,
    });

    // Individual filters (Explicit filtering)
    if (query.code) {
      qb.andWhere('role.code ILIKE :code', { code: `%${query.code}%` });
    }
    if (query.name) {
      qb.andWhere('role.name ILIKE :name', { name: `%${query.name}%` });
    }

    // Global Search (Multi-column filtering)
    if (query.search) {
      qb.andWhere(
        `
        (
          role.name ILIKE :search 
          OR role.code ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [roles, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(roles, totalCount, page, limit).getResult();
  }
}
