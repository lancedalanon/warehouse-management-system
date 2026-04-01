import { Repository } from 'typeorm';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { User } from '@/entities/User';
import { inject, injectable } from 'tsyringe';
import { randomBytes } from 'crypto';
import { ConflictException } from '@/exceptions/ConflictException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import {
  RequestInvitationDTO,
  RequestInvitationSchema,
} from '@/schemas/auth/RequestInvitationSchema';
import { RequestInvitationSentEmailNotification } from '@/emails/RequestInvitationSentEmailNotification';
import { CreateUserService } from '@/services/users/CreateUserService';

@injectable()
export class RequestInvitationService {
  constructor(
    @inject(RequestInvitationSentEmailNotification)
    private readonly requestInvitationSentEmailNotification: RequestInvitationSentEmailNotification,

    @inject(CreateUserService)
    private readonly createUserService: CreateUserService,

    @inject('InvitationRequestRepository')
    private readonly invitationRequestRepo: Repository<InvitationRequest>,

    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(data: RequestInvitationDTO) {
    // Validate the request DTO
    const parsedData = RequestInvitationSchema.parse(data);

    // Check if a user already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: parsedData.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already taken');
    }

    // Check if there’s already an invitation request for this email
    let invitation = await this.invitationRequestRepo.findOne({
      where: { email: parsedData.email },
    });

    if (invitation) {
      // If it exists and user has already joined throw an error
      if (invitation.joinedAt && invitation.userId) {
        throw new ConflictException('User with this email has already joined');
      }

      // If it exists and user has not declined throw an error
      if (invitation.declinedAt === null && !invitation.joinedAt) {
        throw new BadRequestException(
          'Invitation request has already been sent',
        );
      }

      // If it was declined or is no longer associated with a user, update the existing invitation
      invitation.token = randomBytes(32).toString('hex');
      invitation.firstName = parsedData.firstName;
      invitation.middleName = parsedData.middleName ?? null;
      invitation.lastName = parsedData.lastName;
      invitation.suffix = parsedData.suffix ?? null;
      invitation.declinedAt = null;
      invitation.joinedAt = null;
      invitation.roleId = parsedData.roleId;

      await this.invitationRequestRepo.save(invitation);

      await this.requestInvitationSentEmailNotification.send(invitation.email);

      // For non-production environment, accept the invitation immediately and return the token in the response
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction) {
        const payload = {
          firstName: invitation.firstName,
          middleName: invitation.middleName,
          lastName: invitation.lastName,
          suffix: invitation.suffix,
          email: invitation.email,
          roleId: invitation.roleId,
          token: invitation.token,
        };

        await this.createUserService.handle(payload);
      }

      return {
        message: 'Invitation request sent successfully',
      };
    }

    // Otherwise create a new invitation
    invitation = this.invitationRequestRepo.create({
      firstName: parsedData.firstName,
      middleName: parsedData.middleName ?? null,
      lastName: parsedData.lastName,
      suffix: parsedData.suffix ?? null,
      email: parsedData.email,
      token: randomBytes(32).toString('hex'),
      roleId: parsedData.roleId,
    });

    await this.invitationRequestRepo.save(invitation);

    await this.requestInvitationSentEmailNotification.send(invitation.email);

    // For non-production environment, accept the invitation immediately and return the token in the response
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      const payload = {
        firstName: invitation.firstName,
        middleName: invitation.middleName,
        lastName: invitation.lastName,
        suffix: invitation.suffix,
        email: invitation.email,
        roleId: invitation.roleId,
        token: invitation.token,
      };

      await this.createUserService.handle(payload);
    }

    return {
      message:
        'Invitation requested, please check your email for further updates!',
    };
  }
}
