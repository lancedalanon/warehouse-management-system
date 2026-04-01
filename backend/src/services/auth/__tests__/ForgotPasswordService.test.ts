import 'reflect-metadata';
import { container } from 'tsyringe';
import { ForgotPasswordService } from '../ForgotPasswordService';
import { User } from '@/entities/User';
import { PasswordRequest } from '@/entities/PasswordRequest';
import { ConflictException } from '@/exceptions/ConflictException';
import { ForgotPasswordEmailNotification } from '@/emails/ForgotPasswordEmailNotification';
import type { Repository } from 'typeorm';

describe('ForgotPasswordService', () => {
  let passwordRequestRepo: Repository<PasswordRequest>;
  let userRepo: Repository<User>;
  let forgotPasswordEmailNotification: ForgotPasswordEmailNotification;
  let service: ForgotPasswordService;

  const mockUser = {
    email: 'test@test.com',
    firstName: 'John',
  } as unknown as User;

  const mockPasswordRequest = {
    email: 'test@test.com',
    token: 'oldToken',
    usedAt: null,
    createdAt: new Date(),
  } as unknown as PasswordRequest;

  beforeEach(() => {
    passwordRequestRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
    } as unknown as Repository<PasswordRequest>;

    userRepo = {
      findOne: jest.fn(),
    } as unknown as Repository<User>;

    forgotPasswordEmailNotification = {
      send: jest.fn(),
    } as unknown as ForgotPasswordEmailNotification;

    container.registerInstance(
      'PasswordRequestRepository',
      passwordRequestRepo,
    );
    container.registerInstance('UserRepository', userRepo);
    container.registerInstance(
      ForgotPasswordEmailNotification,
      forgotPasswordEmailNotification,
    );

    service = container.resolve(ForgotPasswordService);

    jest.clearAllMocks();
  });

  it('should throw if user does not exist', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.handle({ email: 'nonexistent@test.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create a new password request if none exists', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(null);
    (passwordRequestRepo.save as jest.Mock).mockResolvedValue(true);

    const result = await service.handle({ email: 'test@test.com' });

    expect(passwordRequestRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        token: expect.any(String),
      }),
    );
    expect(passwordRequestRepo.save).toHaveBeenCalled();
    expect(forgotPasswordEmailNotification.send).toHaveBeenCalledWith(
      'test@test.com',
      expect.objectContaining({
        firstName: 'John',
        resetUrl: expect.stringContaining('token='),
      }),
    );
    expect(result).toEqual({
      message: 'Password reset requested, please check your email!',
    });
  });

  it('should update existing password request if it exists', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(
      mockPasswordRequest,
    );
    (passwordRequestRepo.save as jest.Mock).mockResolvedValue(true);

    const result = await service.handle({ email: 'test@test.com' });

    expect(passwordRequestRepo.create).not.toHaveBeenCalled();
    expect(passwordRequestRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        token: expect.any(String),
        usedAt: null,
      }),
    );
    expect(result).toEqual({
      message: 'Password reset requested, please check your email!',
    });
  });

  it('should call email notification with correct parameters', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (passwordRequestRepo.findOne as jest.Mock).mockResolvedValue(null);
    (passwordRequestRepo.save as jest.Mock).mockResolvedValue(true);

    await service.handle({ email: 'test@test.com' });

    expect(forgotPasswordEmailNotification.send).toHaveBeenCalledWith(
      'test@test.com',
      expect.objectContaining({
        firstName: 'John',
        resetUrl: expect.stringContaining('token='),
      }),
    );
  });
});
