import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import {
  UpdatePasswordSchema,
  UpdatePasswordDTO,
} from '@/schemas/auth/UpdatePasswordSchema';

@injectable()
export class UpdatePasswordService {
  constructor(
    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(req: Request, data: unknown) {
    const parsedData: UpdatePasswordDTO = UpdatePasswordSchema.parse(data);

    const jwtUser = req.user;
    if (!jwtUser || !jwtUser.sub) {
      throw new UnauthorizedException('Unauthenticated');
    }

    // IMPORTANT: must select password
    const user = await this.userRepo.findOne({
      where: { id: jwtUser.sub },
      relations: ['roles'],
      select: [
        'id',
        'firstName',
        'middleName',
        'lastName',
        'suffix',
        'email',
        'password',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(
      parsedData.currentPassword,
      user.password,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect current password');
    }

    // Prevent re-using same password
    const samePassword = await bcrypt.compare(
      parsedData.newPassword,
      user.password,
    );
    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash & save new password
    user.password = await bcrypt.hash(parsedData.newPassword, 10);
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
