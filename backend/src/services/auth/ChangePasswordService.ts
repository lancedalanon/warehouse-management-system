import { Repository } from 'typeorm';
import { PasswordRequest } from '@/entities/PasswordRequest';
import { User } from '@/entities/User';
import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcrypt';
import { BadRequestException } from '@/exceptions/BadRequestException';
import { ChangePasswordSchema } from '@/schemas/auth/ChangePasswordSchema';
import { ChangePasswordRequest } from '@/types/services/auth/auth.types';
import { Request } from 'express';

@injectable()
export class ChangePasswordService {
  constructor(
    @inject('PasswordRequestRepository')
    private readonly passwordRequestRepo: Repository<PasswordRequest>,

    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  async handle(req: Request) {
    // Extract email and token from route params
    const { email, token } = req.query as ChangePasswordRequest;

    // Validate request body
    const { password } = ChangePasswordSchema.parse(req.body);

    // Find matching password request
    const request = await this.passwordRequestRepo.findOne({
      where: { email, token },
    });
    if (!request) {
      throw new BadRequestException('Invalid token or email');
    }

    // Check if token already used
    if (request.usedAt) {
      throw new BadRequestException('This token has already been used');
    }

    // Check expiration (15 minutes)
    const createdAt = request.createdAt.getTime();
    const now = Date.now();
    const diffMinutes = (now - createdAt) / 1000 / 60;
    if (diffMinutes >= 15) {
      throw new BadRequestException('Password reset token has expired');
    }

    // Find user
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    user.password = hashedPassword;
    await this.userRepo.save(user);

    // Mark request as used
    request.usedAt = new Date();
    await this.passwordRequestRepo.save(request);

    return {
      message: 'Password changed successfully',
    };
  }
}
