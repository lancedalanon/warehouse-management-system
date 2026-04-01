import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetInvitationRequestService } from '@/services/invitation-requests/GetInvitationRequestService';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('GetInvitationRequestService', () => {
  let invitationRepo: jest.Mocked<Repository<InvitationRequest>>;
  let service: GetInvitationRequestService;

  const mockRequest = {
    id: 1,
    userId: 123,
    email: 'test@example.com',
    role: { id: 2, name: 'User' },
  } as InvitationRequest;

  beforeEach(() => {
    invitationRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<InvitationRequest>>;

    container.registerInstance('InvitationRequestRepository', invitationRepo);

    service = container.resolve(GetInvitationRequestService);

    jest.clearAllMocks();
  });

  it('should return the invitation request successfully', async () => {
    invitationRepo.findOne.mockResolvedValue(mockRequest);

    const result = await service.handle(mockRequest.id);

    expect(invitationRepo.findOne).toHaveBeenCalledWith({
      where: { id: mockRequest.id },
      relations: ['role'],
    });
    expect(result).toEqual(mockRequest);
  });

  it('should throw NotFoundException if the invitation request does not exist', async () => {
    invitationRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(invitationRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
      relations: ['role'],
    });
  });
});
