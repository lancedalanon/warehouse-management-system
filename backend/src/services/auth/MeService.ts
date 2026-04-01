import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { Request } from 'express';

@injectable()
export class MeService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(req: Request) {
    const jwtUser = req.user;

    if (!jwtUser || !jwtUser.sub) {
      throw new UnauthorizedException('Unauthenticated');
    }

    const user = await this.userRepo.findOne({
      where: {
        id: jwtUser.sub,
      },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

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
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
