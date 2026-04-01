import { Not, Repository } from 'typeorm';
import { User } from '@/entities/User';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { Role as RoleEnum } from '@/enums/Role';

@injectable()
export class DeleteUserService implements BaseService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(id: number, authUser?: JwtUserPayload): Promise<User> {
    const user = await this.userRepo.findOne({
      where: {
        id,
        roles: {
          code: Not(RoleEnum.SUPERADMIN),
        },
      },
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    await this.userRepo.softRemove(user);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'USER_DELETED',
      description: `User deleted with email ${user.email}`,
      auditableType: 'User',
      auditableId: user.id,
      userId: authUser?.sub,
      oldValues: { ...user },
    });

    return user;
  }
}
