import { Not, Repository } from 'typeorm';
import { User } from '@/entities/User';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { Role as RoleEnum } from '@/enums/Role';

@injectable()
export class GetUserService implements BaseService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: {
        id,
        roles: {
          code: Not(RoleEnum.SUPERADMIN),
        },
      },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }
}
