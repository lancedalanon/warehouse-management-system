import { Repository } from 'typeorm';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class GetInvitationRequestService implements BaseService {
  constructor(
    @inject('InvitationRequestRepository')
    private readonly invitationRequestRepo: Repository<InvitationRequest>,
  ) {}

  async handle(id: number): Promise<InvitationRequest> {
    const request = await this.invitationRequestRepo.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!request) {
      throw new NotFoundException(`Invitation request with id ${id} not found`);
    }

    return request;
  }
}
