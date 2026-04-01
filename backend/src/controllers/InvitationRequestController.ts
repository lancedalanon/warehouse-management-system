import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { GetInvitationRequestsService } from '@/services/invitation-requests/GetInvitationRequestsService';
import { GetInvitationRequestService } from '@/services/invitation-requests/GetInvitationRequestService';
import { DeclineInvitationRequestService } from '@/services/invitation-requests/DeclineInvitationRequestService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class InvitationRequestController extends BaseController {
  constructor(
    @inject(GetInvitationRequestsService)
    private readonly getRequestInvitationsService: GetInvitationRequestsService,
    @inject(GetInvitationRequestService)
    private readonly getRequestInvitationService: GetInvitationRequestService,
    @inject(DeclineInvitationRequestService)
    private readonly declineInvitationService: DeclineInvitationRequestService,
  ) {
    super();
    this.getInvitationRequests = this.getInvitationRequests.bind(this);
    this.getInvitationRequest = this.getInvitationRequest.bind(this);
    this.declineInvitationRequest = this.declineInvitationRequest.bind(this);
  }

  async getInvitationRequests(req: Request, res: Response) {
    const result = await this.getRequestInvitationsService.handle(req);

    ResponseHandler.success(
      res,
      'Invitation requests retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getInvitationRequest(req: Request, res: Response) {
    const result = await this.getRequestInvitationService.handle(
      Number(req.params.id),
    );

    ResponseHandler.success(
      res,
      'Invitation request retrieved successfully',
      result,
    );
  }

  async declineInvitationRequest(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await this.declineInvitationService.handle(id);

    ResponseHandler.success(
      res,
      'Invitation request declined successfully',
      result,
    );
  }
}
