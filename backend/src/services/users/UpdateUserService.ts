import { Repository, Not } from 'typeorm';
import { User } from '@/entities/User';
import { Role } from '@/entities/Role';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  UpdateUserDTO,
  UpdateUserSchema,
} from '@/schemas/users/UpdateUserSchema';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { Role as RoleEnum } from '@/enums/Role';

@injectable()
export class UpdateUserService implements BaseService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,

    @inject('RoleRepository')
    private readonly roleRepo: Repository<Role>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(
    id: number,
    data: UpdateUserDTO,
    authUser?: JwtUserPayload,
  ): Promise<User> {
    const parsedData = await UpdateUserSchema.parseAsync(data);

    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user || user.roles.some((r) => r.code === RoleEnum.SUPERADMIN)) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const prevUser = JSON.parse(JSON.stringify(this.pickSingleRole(user)));
    const oldEmail = user.email;

    // Validate email uniqueness if changed
    if (parsedData.email && parsedData.email !== oldEmail) {
      const existingUser = await this.userRepo.findOne({
        where: { email: parsedData.email, id: Not(user.id) },
      });
      if (existingUser) {
        throw new ValidationHandler(
          { field: 'email', message: 'Email is already in use by another user'}
        );
      }
      user.emailVerifiedAt = null; // reset verification if email changed
    }

    // Ensure role exists and is not SUPERADMIN
    const role = await this.roleRepo.findOne({
      where: { id: parsedData.roleId },
    });
    if (!role) {
      throw new ValidationHandler(
        { field: 'roleId', message: 'Selected role does not exist'}
      );
    }
    if (role.code === RoleEnum.SUPERADMIN) {
      throw new ValidationHandler(
        { field: 'roleId', message: 'Cannot assign SUPERADMIN role'}
      );
    }

    // Apply updates
    user.firstName = parsedData.firstName;
    user.middleName = parsedData.middleName ?? null;
    user.lastName = parsedData.lastName;
    user.suffix = parsedData.suffix ?? null;
    user.email = parsedData.email;
    user.roles = [role];

    const savedUser = await this.userRepo.save(user);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'USER_UPDATED',
      description: `User updated with email ${user.email}`,
      auditableType: 'User',
      auditableId: user.id,
      userId: authUser?.sub,
      oldValues: prevUser,
      newValues: this.pickSingleRole(savedUser),
    });

    return savedUser;
  }

  private pickSingleRole(user: User) {
    const { roles, ...rest } = user;
    return {
      ...rest,
      role: roles?.[0]?.name ?? null,
    };
  }
}
