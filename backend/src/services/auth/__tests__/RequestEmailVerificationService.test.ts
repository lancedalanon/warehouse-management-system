import 'reflect-metadata';
import { container } from 'tsyringe';
import { RequestEmailVerificationService } from '../RequestEmailVerificationService';
import { User } from '@/entities/User';
import { EmailVerifyService } from '@/lib/EmailVerifyService';
import { VerifyEmailNotification } from '@/emails/VerifyEmailNotification';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import type { Repository } from 'typeorm';

jest.mock('@/lib/EmailVerifyService');
jest.mock('@/emails/VerifyEmailNotification');

describe('RequestEmailVerificationService', () => {
  let userRepo: Repository<User>;
  let emailVerifyService: EmailVerifyService;
  let verifyEmailNotification: VerifyEmailNotification;
  let service: RequestEmailVerificationService;

  const mockUser = {
    email: 'test@test.com',
    firstName: 'John',
    emailVerifiedAt: null,
  } as unknown as User;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
    } as unknown as Repository<User>;

    emailVerifyService = {
      generate: jest.fn().mockReturnValue('token123'),
    } as unknown as EmailVerifyService;

    verifyEmailNotification = {
      send: jest.fn(),
    } as unknown as VerifyEmailNotification;

    container.registerInstance('UserRepository', userRepo);
    container.registerInstance(EmailVerifyService, emailVerifyService);
    container.registerInstance(VerifyEmailNotification, verifyEmailNotification);

    service = container.resolve(RequestEmailVerificationService);

    jest.clearAllMocks();
  });

  it('should throw if user not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.handle({ email: 'unknown@test.com' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return message if email already verified', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue({ ...mockUser, emailVerifiedAt: new Date() });

    const result = await service.handle({ email: 'test@test.com' });

    expect(result).toEqual({ message: 'Email is already verified' });
  });

  it('should send verification email if not verified', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.handle({ email: 'test@test.com' });

    expect(emailVerifyService.generate).toHaveBeenCalledWith({ email: 'test@test.com' });
    expect(verifyEmailNotification.send).toHaveBeenCalledWith(
      'test@test.com',
      expect.objectContaining({ firstName: 'John', verifyUrl: expect.stringContaining('token123') })
    );
    expect(result).toEqual({ message: 'Verification email sent successfully' });
  });
});