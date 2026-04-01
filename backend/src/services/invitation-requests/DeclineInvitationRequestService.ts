import { Repository } from 'typeorm';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { inject, injectable } from 'tsyringe';

@injectable()
export class DeclineInvitationRequestService {
  constructor(
    @inject('InvitationRequestRepository')
    private readonly invitationRequestRepo: Repository<InvitationRequest>,
  ) {}

  async handle(id: number): Promise<InvitationRequest> {
    const invitation = await this.invitationRequestRepo.findOne({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation request not found');
    }

    if (!invitation.joinedAt) {
      invitation.declinedAt = new Date();
      await this.invitationRequestRepo.save(invitation);
    }

    return invitation;
  }
}
