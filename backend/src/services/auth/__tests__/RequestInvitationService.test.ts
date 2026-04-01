import 'reflect-metadata';
import { container } from 'tsyringe';
import { RequestInvitationService } from '../RequestInvitationService';
import { User } from '@/entities/User';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { RequestInvitationSentEmailNotification } from '@/emails/RequestInvitationSentEmailNotification';
import { CreateUserService } from '@/services/users/CreateUserService';
import { ConflictException } from '@/exceptions/ConflictException';
import type { Repository } from 'typeorm';
import { BadRequestException } from '@/exceptions/BadRequestException';

jest.mock('@/emails/RequestInvitationSentEmailNotification');
jest.mock('@/services/users/CreateUserService');

describe('RequestInvitationService', () => {
  let invitationRepo: Repository<InvitationRequest>;
  let userRepo: Repository<User>;
  let service: RequestInvitationService;
  let emailNotification: RequestInvitationSentEmailNotification;
  let createUserService: CreateUserService;

  const mockInvitation = {
    email: 'invite@test.com',
    joinedAt: null,
    declinedAt: null,
    token: 'token123',
    save: jest.fn(),
  } as unknown as InvitationRequest;

  const mockUser = {
    email: 'existing@test.com',
  } as unknown as User;

  beforeEach(() => {
    invitationRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as Repository<InvitationRequest>;
    userRepo = { findOne: jest.fn() } as unknown as Repository<User>;

    emailNotification = {
      send: jest.fn(),
    } as unknown as RequestInvitationSentEmailNotification;
    createUserService = { handle: jest.fn() } as unknown as CreateUserService;

    container.registerInstance('InvitationRequestRepository', invitationRepo);
    container.registerInstance('UserRepository', userRepo);
    container.registerInstance(
      RequestInvitationSentEmailNotification,
      emailNotification,
    );
    container.registerInstance(CreateUserService, createUserService);

    service = container.resolve(RequestInvitationService);

    jest.clearAllMocks();
  });

  it('should throw if user already exists', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

    await expect(
      service.handle({
        email: 'existing@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw if invitation already sent and not declined', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    (invitationRepo.findOne as jest.Mock).mockResolvedValue(mockInvitation);

    await expect(
      service.handle({
        email: 'invite@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update invitation if declined and send email', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const declinedInvitation = { ...mockInvitation, declinedAt: new Date() };
    (invitationRepo.findOne as jest.Mock).mockResolvedValue(declinedInvitation);

    await service.handle({
      email: 'invite@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roleId: 1,
    });

    expect(invitationRepo.save).toHaveBeenCalled();
    expect(emailNotification.send).toHaveBeenCalledWith('invite@test.com');
    expect(createUserService.handle).toHaveBeenCalled();
  });

  it('should create new invitation if none exists', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    (invitationRepo.findOne as jest.Mock).mockResolvedValue(null);
    (invitationRepo.create as jest.Mock).mockImplementation((data) => data);

    await service.handle({
      email: 'new@test.com',
      firstName: 'Jane',
      lastName: 'Doe',
      roleId: 2,
    });

    expect(invitationRepo.create).toHaveBeenCalled();
    expect(invitationRepo.save).toHaveBeenCalled();
    expect(emailNotification.send).toHaveBeenCalled();
    expect(createUserService.handle).toHaveBeenCalled();
  });
});
