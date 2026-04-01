import { Repository } from 'typeorm';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { PaginationHelper } from '@/lib/PaginationHelper';
import { PaginationRequest } from '@/types/pagination/pagination.types';
import { Request } from 'express';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

const SORT_COLUMNS = {
  createdAt: 'invitation.createdAt',
  updatedAt: 'invitation.updatedAt',
  email: 'invitation.email',
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

@injectable()
export class GetInvitationRequestsService implements BaseService {
  constructor(
    @inject('InvitationRequestRepository')
    private readonly invitationRequestRepo: Repository<InvitationRequest>,
  ) {}

  async handle(req: Request) {
    const query = req.query as PaginationRequest<InvitationRequest> & {
      status?: 'pending' | 'declined';
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

    const qb = this.invitationRequestRepo
      .createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.role', 'role')
      .where('invitation.joinedAt IS NULL');

    // Filters
    if (query.id) qb.andWhere('invitation.id = :id', { id: Number(query.id) });
    if (query.status === 'declined') {
      qb.andWhere('invitation.declinedAt IS NOT NULL');
    } else if (query.status === 'pending') {
      qb.andWhere(
        'invitation.declinedAt IS NULL AND invitation.joinedAt IS NULL',
      );
    }

    // Global search
    if (query.search) {
      qb.andWhere(
        `
        (
          invitation.email ILIKE :search
          OR role.name ILIKE :search
          OR role.code ILIKE :search
        )
        `,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, totalCount] = await qb.getManyAndCount();

    return new PaginationHelper(requests, totalCount, page, limit).getResult();
  }
}
