import { Repository } from 'typeorm';
import { PasswordRequest } from '@/entities/PasswordRequest';
import { User } from '@/entities/User';
import { inject, injectable } from 'tsyringe';
import { randomBytes } from 'crypto';
import { ConflictException } from '@/exceptions/ConflictException';
import {
  ForgotPasswordDTO,
  ForgotPasswordSchema,
} from '@/schemas/auth/ForgotPasswordSchema';
import { ForgotPasswordEmailNotification } from '@/emails/ForgotPasswordEmailNotification';

@injectable()
export class ForgotPasswordService {
  constructor(
    @inject('PasswordRequestRepository')
    private readonly passwordRequestRepo: Repository<PasswordRequest>,

    @inject('UserRepository')
    private readonly userRepo: Repository<User>,

    @inject(ForgotPasswordEmailNotification)
    private readonly forgotPasswordEmailNotification: ForgotPasswordEmailNotification,
  ) {}

  async handle(data: ForgotPasswordDTO) {
    const parsedData = ForgotPasswordSchema.parse(data);

    // Check if the user exists
    const user = await this.userRepo.findOne({
      where: { email: parsedData.email },
    });
    if (!user) {
      throw new ConflictException('User with this email does not exist');
    }

    // Generate a random token
    const token = randomBytes(32).toString('hex');

    // Check if a password request already exists
    let passwordRequest = await this.passwordRequestRepo.findOne({
      where: { email: parsedData.email },
    });

    if (passwordRequest) {
      // Update existing request
      passwordRequest.token = token;
      passwordRequest.usedAt = null;
      passwordRequest.createdAt = new Date();
    } else {
      // Create new request
      passwordRequest = this.passwordRequestRepo.create({
        email: parsedData.email,
        token,
      });
    }

    await this.passwordRequestRepo.save(passwordRequest);

    await this.forgotPasswordEmailNotification.send(user.email, {
      firstName: user.firstName,
      resetUrl: `${process.env.APP_URL}/auth/reset-password?token=${token}&email=${user.email}`,
    });

    return {
      message: 'Password reset requested, please check your email!',
    };
  }
}
