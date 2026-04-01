import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetInvitationRequestsService } from '@/services/invitation-requests/GetInvitationRequestsService';
import { InvitationRequest } from '@/entities/InvitationRequest';

describe('GetInvitationRequestsService', () => {
  let invitationRepo: Repository<InvitationRequest>;
  let service: GetInvitationRequestsService;
  let qb: jest.Mocked<SelectQueryBuilder<InvitationRequest>>;

  const mockRequests: InvitationRequest[] = [
    {
      id: 1,
      email: 'test@example.com',
      joinedAt: null,
      declinedAt: null,
      role: { id: 2, name: 'User', code: 'USER' },
    } as InvitationRequest,
  ];

  beforeEach(() => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<InvitationRequest>>;

    invitationRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<InvitationRequest>;

    container.registerInstance('InvitationRequestRepository', invitationRepo);
    service = container.resolve(GetInvitationRequestsService);

    jest.clearAllMocks();
  });

  it('should return paginated invitation requests', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRequests, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(invitationRepo.createQueryBuilder).toHaveBeenCalledWith('invitation');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('invitation.role', 'role');
    expect(qb.orderBy).toHaveBeenCalledWith('invitation.createdAt', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual(mockRequests);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters for id and status', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRequests, 1]);

    const req = { query: { id: 1, status: 'declined', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('invitation.id = :id', { id: 1 });
    expect(qb.andWhere).toHaveBeenCalledWith('invitation.declinedAt IS NOT NULL');
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRequests, 1]);

    const req = { query: { search: 'test', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('invitation.email ILIKE :search'),
      { search: '%test%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRequests, 1]);

    const req = { query: { sortBy: 'email', sortDirection: 'ASC', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('invitation.email', 'ASC');
  });

  it('should fallback to createdAt sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRequests, 1]);

    const req = { query: { sortBy: 'invalidColumn', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('invitation.createdAt', 'DESC');
  });

  it('should cap limit to 100 when exceeding maximum', async () => {
    qb.getManyAndCount.mockResolvedValue([mockRequests, 1]);

    const req = { query: { page: 1, limit: 500 } } as unknown as Request;

    await service.handle(req);

    expect(qb.take).toHaveBeenCalledWith(100);
  });
});