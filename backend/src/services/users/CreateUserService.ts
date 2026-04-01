import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { Role } from '@/entities/Role';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  CreateUserDTO,
  CreateUserSchema,
} from '@/schemas/users/CreateUserSchema';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role as RoleEnum } from '@/enums/Role';
import { InvitationAcceptedEmailNotification } from '@/emails/InvitationAcceptedEmailNotification';
import { PublicUser } from '@/types/services/users/user.types';

@injectable()
export class CreateUserService implements BaseService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,

    @inject('RoleRepository')
    private readonly roleRepo: Repository<Role>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,

    @inject('InvitationRequestRepository')
    private readonly invitationRequestRepo: Repository<InvitationRequest>,

    private readonly invitationAcceptedEmailNotification: InvitationAcceptedEmailNotification,
  ) {}

  async handle(
    data: CreateUserDTO,
    authUser?: JwtUserPayload,
  ): Promise<PublicUser> {
    const parsedData = await CreateUserSchema.parseAsync(data);

    // Ensure email is unique
    const existingUser = await this.userRepo.findOne({
      where: { email: parsedData.email },
    });
    if (existingUser) {
      throw new ValidationHandler({
        field: 'email',
        message: 'Email is already in use',
      });
    }

    // Ensure role exists and is not SUPERADMIN
    const role = await this.roleRepo.findOne({
      where: { id: parsedData.roleId },
    });
    if (!role) {
      throw new ValidationHandler({
        field: 'roleId',
        message: 'Selected role does not exist',
      });
    }
    if (role.code === RoleEnum.SUPERADMIN) {
      throw new ValidationHandler({
        field: 'roleId',
        message: 'Cannot assign SUPERADMIN role',
      });
    }

    // Generate random password and hash it
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = this.userRepo.create({
      firstName: parsedData.firstName,
      middleName: parsedData.middleName ?? null,
      lastName: parsedData.lastName,
      suffix: parsedData.suffix ?? null,
      email: parsedData.email,
      password: hashedPassword,
      roles: [role],
    });

    const savedUser = await this.userRepo.save(user);
    const { password: _, ...userWithoutPassword } = savedUser;

    // handle invitation request if token is provided
    if (parsedData.token) {
      const invitation = await this.invitationRequestRepo.findOne({
        where: { token: parsedData.token },
      });
      if (invitation) {
        invitation.joinedAt = new Date();
        invitation.userId = savedUser.id;
        await this.invitationRequestRepo.save(invitation);
      }
    }

    // Send invitation accepted email notification
    await this.invitationAcceptedEmailNotification.send(parsedData.email, {
      firstName: parsedData.firstName,
      email: parsedData.email,
      password: randomPassword,
      loginUrl: `${process.env.APP_URL}/auth/login`,
    });

    // Pick single role name for PublicUser
    const publicUser: PublicUser = {
      ...userWithoutPassword,
      role: savedUser.roles?.[0]?.name ?? null,
    };

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'USER_CREATED',
      description: `User created with email ${savedUser.email}`,
      auditableType: 'User',
      auditableId: savedUser.id,
      userId: authUser?.sub,
      oldValues: null,
      newValues: publicUser,
    });

    return publicUser;
  }
}
