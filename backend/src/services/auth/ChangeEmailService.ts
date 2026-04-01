import { inject, injectable } from 'tsyringe';
import { Not, Repository } from 'typeorm';
import { User } from '@/entities/User';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import { ChangeEmailSchema, ChangeEmailDTO } from '@/schemas/auth/ChangeEmailSchema';
import { VerifyEmailNotification } from '@/emails/VerifyEmailNotification';
import { EmailVerifyService } from '@/lib/EmailVerifyService';
import { ValidationHandler } from '@/lib/ValidationHandler';

@injectable()
export class ChangeEmailService {
  constructor(
    @inject(EmailVerifyService)
    private readonly emailVerifyService: EmailVerifyService,

    @inject(VerifyEmailNotification)
    private readonly verifyEmailNotification: VerifyEmailNotification,

    @inject('UserRepository')
    private readonly userRepo: Repository<User>,

    @inject('InvitationRequestRepository')
    private readonly invitationRequestRepo: Repository<InvitationRequest>,
  ) {}

  async handle(req: Request, rawData: unknown) {
    const jwtUser = req.user;

    if (!jwtUser?.sub) {
      throw new UnauthorizedException('Unauthenticated');
    }

    const userId = Number(jwtUser.sub);

    // Schema validation FIRST
    const parsedData: ChangeEmailDTO =
      await ChangeEmailSchema.parseAsync(rawData);

    // Get current user
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
      select: [
        'id',
        'firstName',
        'middleName',
        'lastName',
        'suffix',
        'email',
        'password',
        'emailVerifiedAt',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(
      parsedData.currentPassword,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    // Business validation — email uniqueness
    const existingUser = await this.userRepo.findOne({
      where: {
        email: parsedData.email,
        id: Not(userId),
      },
    });

    if (existingUser) {
      throw new ValidationHandler([
        { field: 'email', message: 'This email is already registered to another account'},
      ]);
    }

    // Handle invitation disassociation (audit purpose)
    const invitation = await this.invitationRequestRepo.findOne({
      where: { email: user.email },
    });

    if (invitation) {
      invitation.userId = null;
      await this.invitationRequestRepo.save(invitation);
    }

    // Update email
    user.email = parsedData.email;
    user.emailVerifiedAt = null;

    await this.userRepo.save(user);

    // Generate verification token
    const token = this.emailVerifyService.generate({
      email: user.email,
    });

    await this.verifyEmailNotification.send(user.email, {
      firstName: user.firstName,
      verifyUrl: `${process.env.APP_URL}/auth/verify-email?token=${token}`,
    });

    // Return clean response DTO
    return {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      suffix: user.suffix,
      email: user.email,
      roles: user.roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}