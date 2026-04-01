import 'reflect-metadata';
import { container } from 'tsyringe';
import { VerifyEmailService } from '../VerifyEmailService';
import { EmailVerifyService } from '@/lib/EmailVerifyService';
import { User } from '@/entities/User';
import { BadRequestException } from '@/exceptions/BadRequestException';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import type { Repository } from 'typeorm';

describe('VerifyEmailService', () => {
  let userRepo: Repository<User>;
  let emailVerifyService: { verify: jest.Mock };
  let service: VerifyEmailService;

  const mockUser = {
    email: 'test@test.com',
    emailVerifiedAt: null,
    save: jest.fn(),
  } as unknown as User;

  beforeEach(() => {
    userRepo = { findOne: jest.fn(), save: jest.fn() } as unknown as Repository<User>;
    emailVerifyService = { verify: jest.fn() };

    container.registerInstance('UserRepository', userRepo);
    container.registerInstance(
        EmailVerifyService,
        emailVerifyService as unknown as EmailVerifyService
    );

    service = container.resolve(VerifyEmailService);
    jest.clearAllMocks();
  });

  it('should throw if no token is provided', async () => {
    await expect(service.handle('')).rejects.toThrow(BadRequestException);
  });

  it('should throw if token is invalid', async () => {
    emailVerifyService.verify.mockImplementation(() => { throw new Error('Invalid token'); });
    await expect(service.handle('invalidToken')).rejects.toThrow(BadRequestException);
  });

  it('should throw if user not found', async () => {
    emailVerifyService.verify.mockReturnValue({ email: 'notfound@test.com' });
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.handle('validToken')).rejects.toThrow(UnauthorizedException);
  });

  it('should return message if email is already verified', async () => {
    emailVerifyService.verify.mockReturnValue({ email: 'test@test.com' });
    (userRepo.findOne as jest.Mock).mockResolvedValue({ ...mockUser, emailVerifiedAt: new Date() });

    const result = await service.handle('validToken');
    expect(result).toEqual({ message: 'Email is already verified' });
  });

  it('should successfully verify email', async () => {
    emailVerifyService.verify.mockReturnValue({ email: 'test@test.com' });
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (userRepo.save as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.handle('validToken');

    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ emailVerifiedAt: expect.any(Date) }));
    expect(result).toEqual({ message: 'Email verified successfully' });
  });
});