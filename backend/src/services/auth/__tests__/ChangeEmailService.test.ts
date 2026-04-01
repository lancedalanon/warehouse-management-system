import 'reflect-metadata';
import { container } from 'tsyringe';
import bcrypt from 'bcrypt';
import { ChangeEmailService } from '../ChangeEmailService';
import { User } from '@/entities/User';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { EmailVerifyService } from '@/lib/EmailVerifyService';
import { VerifyEmailNotification } from '@/emails/VerifyEmailNotification';
import { UnauthorizedException } from '@/exceptions/UnauthorizedException';
import { ValidationException } from '@/exceptions/ValidationException';
import type { Repository, FindOneOptions } from 'typeorm';
import type { Request } from 'express';

jest.mock('bcrypt');
jest.mock('@/lib/EmailVerifyService');
jest.mock('@/emails/VerifyEmailNotification');

describe('ChangeEmailService', () => {
  let userRepo: Repository<User>;
  let invitationRequestRepo: Repository<InvitationRequest>;
  let emailVerifyService: EmailVerifyService;
  let verifyEmailNotification: VerifyEmailNotification;
  let service: ChangeEmailService;

  const mockUser = {
    id: 1,
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    suffix: null,
    email: 'old@test.com',
    password: 'hashed-password',
    roles: [{ id: 1, code: 'ADMIN', name: 'Admin' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerifiedAt: new Date(),
  } as unknown as User;

  const mockInvitation = {
    id: 1,
    email: 'old@test.com',
    userId: 1,
  } as unknown as InvitationRequest;

  beforeEach(() => {
    // Properly typed repository mocks
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<User>;

    invitationRequestRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<InvitationRequest>;

    emailVerifyService = {
      generate: jest.fn(),
    } as unknown as EmailVerifyService;

    verifyEmailNotification = {
      send: jest.fn(),
    } as unknown as VerifyEmailNotification;

    // Register all dependencies in tsyringe container
    container.registerInstance('UserRepository', userRepo);
    container.registerInstance('InvitationRequestRepository', invitationRequestRepo);
    container.registerInstance(EmailVerifyService, emailVerifyService);
    container.registerInstance(VerifyEmailNotification, verifyEmailNotification);

    service = container.resolve(ChangeEmailService);

    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if user is not authenticated', async () => {
    const req = { user: null } as unknown as Request;

    await expect(
      service.handle(req, { email: 'new@test.com', currentPassword: 'validpass' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw validation error if password is too short', async () => {
    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(
      service.handle(req, { email: 'new@test.com', currentPassword: 'short' })
    ).rejects.toThrow();
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(
      service.handle(req, { email: 'new@test.com', currentPassword: 'validpass' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password is incorrect', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(
      service.handle(req, { email: 'new@test.com', currentPassword: 'validpass' })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ValidationException if email already exists', async () => {
    (userRepo.findOne as jest.Mock).mockImplementation((options: FindOneOptions<User>) => {
      const where = options.where as Partial<User>;
      if (where?.id === 1) return Promise.resolve(mockUser); // current user
      if (where?.email === 'new@test.com') return Promise.resolve({ id: 2 } as User); // duplicate
      return Promise.resolve(null);
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = { user: { sub: 1 } } as unknown as Request;

    await expect(
      service.handle(req, { email: 'new@test.com', currentPassword: 'validpass' })
    ).rejects.toThrow(ValidationException);
  });

  it('should successfully update email and send verification', async () => {
    (userRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(mockUser) // fetch current user
      .mockResolvedValueOnce(null); // check for duplicate

    (invitationRequestRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (emailVerifyService.generate as jest.Mock).mockReturnValue('verification-token');

    (invitationRequestRepo.save as jest.Mock).mockResolvedValue({ ...mockInvitation, userId: null });
    (userRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, email: 'new@test.com', emailVerifiedAt: null });

    const req = { user: { sub: 1 } } as unknown as Request;

    const result = await service.handle(req, { email: 'new@test.com', currentPassword: 'validpass' });

    expect(invitationRequestRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@test.com', emailVerifiedAt: null }));
    expect(emailVerifyService.generate).toHaveBeenCalledWith({ email: 'new@test.com' });
    expect(verifyEmailNotification.send).toHaveBeenCalledWith(
      'new@test.com',
      expect.objectContaining({ firstName: 'John', verifyUrl: expect.stringContaining('verification-token') })
    );

    expect(result.email).toBe('new@test.com');
    expect(result.roles).toEqual(mockUser.roles);
  });
});