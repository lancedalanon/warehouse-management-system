import { Repository } from 'typeorm';
import { AuditLog } from '@/entities/AuditLog';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { PaginationRequest } from '@/types/pagination/pagination.types';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

const SORT_COLUMNS = {
  id: 'audit.id',
  event: 'audit.event',
  auditableType: 'audit.auditableType',
  auditableId: 'audit.auditableId',
  createdAt: 'audit.createdAt',
  userFirstName: 'user.firstName',
  userLastName: 'user.lastName',
  userEmail: 'user.email',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetAuditLogsService implements BaseService {
  constructor(
    @inject('AuditLogRepository')
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<AuditLog> & {
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

    const qb = this.auditLogRepo.createQueryBuilder('audit');
    qb.leftJoinAndSelect('audit.user', 'user');

    // Filters
    if (query.id) qb.andWhere('audit.id = :id', { id: Number(query.id) });
    if (query.event)
      qb.andWhere('audit.event ILIKE :event', { event: `%${query.event}%` });
    if (query.auditableType)
      qb.andWhere('audit.auditableType = :auditableType', {
        auditableType: query.auditableType,
      });
    if (query.auditableId)
      qb.andWhere('audit.auditableId = :auditableId', {
        auditableId: Number(query.auditableId),
      });
    if (query.userId)
      qb.andWhere('audit.userId = :userId', { userId: Number(query.userId) });

    // Global search
    if (query.search) {
      qb.andWhere(
        `
        (
          audit.event ILIKE :search
          OR audit.description ILIKE :search
          OR audit.auditableType ILIKE :search
          OR CONCAT(user.firstName, ' ', user.lastName) ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(logs, totalCount, page, limit).getResult();
  }
}
