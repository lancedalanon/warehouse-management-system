import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '@/entities/User';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { EmailVerifyService } from '@/lib/EmailVerifyService';
import { VerifyEmailNotification } from '@/emails/VerifyEmailNotification';
import {
  RequestEmailVerificationDTO,
  RequestEmailVerificationSchema,
} from '@/schemas/auth/RequestEmailVerificationSchema';

@injectable()
export class RequestEmailVerificationService {
  constructor(
    @inject(EmailVerifyService)
    private readonly emailVerifyService: EmailVerifyService,

    @inject(VerifyEmailNotification)
    private readonly verifyEmailNotification: VerifyEmailNotification,

    @inject('UserRepository')
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Handle sending an email verification token
   */
  async handle(data: RequestEmailVerificationDTO) {
    const parsedData = RequestEmailVerificationSchema.parse(data);

    // Find user
    const user = await this.userRepo.findOne({
      where: { email: parsedData.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    // Generate HMAC token
    const token = this.emailVerifyService.generate({ email: user.email });

    // Send email
    await this.verifyEmailNotification.send(user.email, {
      firstName: user.firstName,
      verifyUrl: `${process.env.APP_URL}/auth/verify-email?token=${token}`,
    });

    return { message: 'Verification email sent successfully' };
  }
}
