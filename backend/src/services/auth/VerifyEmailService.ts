import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { BadRequestException } from '@/exceptions/BadRequestException';
import { EmailVerifyService } from '@/lib/EmailVerifyService';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';

@injectable()
export class VerifyEmailService {
  constructor(
    @inject(EmailVerifyService)
    private readonly emailVerifyService: EmailVerifyService,

    @inject('UserRepository') 
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Validate token, check user existence, and mark email as verified
   */
  async handle(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    let payload;
    try {
      payload = this.emailVerifyService.verify(token);
    } catch (err: unknown) {
      throw new BadRequestException(
        (err as Error).message || 'Invalid or expired token',
      );
    }

    const user = await this.userRepo.findOne({
      where: { email: payload.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    user.emailVerifiedAt = new Date();
    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }
}
