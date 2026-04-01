import { Repository } from 'typeorm';
import { Role } from '@/entities/Role';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { Role as RoleCode } from '@/enums/Role';

@injectable()
export class GetRoleService implements BaseService {
  constructor(
    @inject('RoleRepository')
    private readonly roleRepo: Repository<Role>,
  ) {}

  async handle(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
    });

    if (!role || role.code === RoleCode.SUPERADMIN) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    return role;
  }
}
