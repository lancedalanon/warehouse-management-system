import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { Request } from 'express';
import {
  UpdateAccountInfoSchema,
  UpdateAccountInfoDTO,
} from '@/schemas/auth/UpdateAccountInfoSchema';

@injectable()
export class UpdateAccountInfoService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(req: Request, data: unknown) {
    const parsedData: UpdateAccountInfoDTO =
      UpdateAccountInfoSchema.parse(data);

    const jwtUser = req.user;

    if (!jwtUser || !jwtUser.sub) {
      throw new UnauthorizedException('Unauthenticated');
    }

    const user = await this.userRepo.findOne({
      where: { id: jwtUser.sub },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user fields
    user.firstName = parsedData.firstName;
    user.middleName = parsedData.middleName ?? null;
    user.lastName = parsedData.lastName;
    user.suffix = parsedData.suffix ?? null;

    await this.userRepo.save(user);

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
      updatedAt: user.updatedAt,
    };
  }
}
