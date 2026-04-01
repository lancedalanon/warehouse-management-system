import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { PaginationRequest } from '@/types/pagination/pagination.types';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { Role } from '@/enums/Role';

const SORT_COLUMNS = {
  id: 'user.id',
  firstName: 'user.firstName',
  lastName: 'user.lastName',
  email: 'user.email',
  createdAt: 'user.createdAt',
  updatedAt: 'user.updatedAt',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetUsersService implements BaseService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<User> & {
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

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('roles.code != :superadmin', { superadmin: Role.SUPERADMIN });

    // Individual filters
    if (query.id) qb.andWhere('user.id = :id', { id: Number(query.id) });
    if (query.firstName)
      qb.andWhere('user.firstName ILIKE :firstName', {
        firstName: `%${query.firstName}%`,
      });
    if (query.middleName)
      qb.andWhere('user.middleName ILIKE :middleName', {
        middleName: `%${query.middleName}%`,
      });
    if (query.lastName)
      qb.andWhere('user.lastName ILIKE :lastName', {
        lastName: `%${query.lastName}%`,
      });
    if (query.suffix)
      qb.andWhere('user.suffix ILIKE :suffix', { suffix: `%${query.suffix}%` });
    if (query.email)
      qb.andWhere('user.email ILIKE :email', { email: `%${query.email}%` });

    // Global search
    if (query.search) {
      qb.andWhere(
        `
        (
          user.firstName ILIKE :search
          OR user.middleName ILIKE :search
          OR user.lastName ILIKE :search
          OR user.email ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [users, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(users, totalCount, page, limit).getResult();
  }
}
