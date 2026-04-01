import 'reflect-metadata';
import { container } from 'tsyringe';
import { DeclineInvitationRequestService } from '@/services/invitation-requests/DeclineInvitationRequestService';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('DeclineInvitationRequestService', () => {
  let invitationRepo: jest.Mocked<Repository<InvitationRequest>>;
  let service: DeclineInvitationRequestService;

  const mockInvitation = {
    id: 1,
    userId: 123,
    joinedAt: null,
    declinedAt: null,
  } as InvitationRequest;

  beforeEach(() => {
    invitationRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<InvitationRequest>>;

    container.registerInstance('InvitationRequestRepository', invitationRepo);

    service = container.resolve(DeclineInvitationRequestService);

    jest.clearAllMocks();
  });

  it('should decline an invitation if not joined yet', async () => {
    invitationRepo.findOne.mockResolvedValue({ ...mockInvitation });

    const result = await service.handle(mockInvitation.id);

    expect(invitationRepo.findOne).toHaveBeenCalledWith({ where: { id: mockInvitation.id } });
    expect(invitationRepo.save).toHaveBeenCalled();
    expect(result.declinedAt).toBeInstanceOf(Date);
  });

  it('should not change declinedAt if already joined', async () => {
    const joinedInvitation = { ...mockInvitation, joinedAt: new Date() };
    invitationRepo.findOne.mockResolvedValue(joinedInvitation);

    const result = await service.handle(joinedInvitation.id);

    expect(invitationRepo.save).not.toHaveBeenCalled();
    expect(result.declinedAt).toBeNull();
  });

  it('should throw NotFoundException if invitation does not exist', async () => {
    invitationRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(invitationRepo.save).not.toHaveBeenCalled();
  });
});