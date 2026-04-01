import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { CreateUserService } from '@/services/users/CreateUserService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';

import { User } from '@/entities/User';
import { Role } from '@/entities/Role';
import { InvitationRequest } from '@/entities/InvitationRequest';

import { Role as RoleEnum } from '@/enums/Role';
import { JwtUserPayload } from '@/types/middlewares/express';
import { InvitationAcceptedEmailNotification } from '@/emails/InvitationAcceptedEmailNotification';
import { ValidationException } from '@/exceptions/ValidationException';

jest.mock('bcrypt');
jest.mock('crypto');

describe('CreateUserService', () => {
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let invitationRepo: jest.Mocked<Repository<InvitationRequest>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let emailNotification: jest.Mocked<InvitationAcceptedEmailNotification>;

  let service: CreateUserService;

  const mockRole = {
    id: 2,
    name: 'User',
    code: 'USER',
  } as Role;

  const mockUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashed',
    roles: [mockRole],
  } as User;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    roleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Role>>;

    invitationRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<InvitationRequest>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    emailNotification = {
      send: jest.fn(),
    } as unknown as jest.Mocked<InvitationAcceptedEmailNotification>;

    container.registerInstance('UserRepository', userRepo);
    container.registerInstance('RoleRepository', roleRepo);
    container.registerInstance('InvitationRequestRepository', invitationRepo);
    container.registerInstance(CreateAuditLogService, auditService);
    container.registerInstance(
      InvitationAcceptedEmailNotification,
      emailNotification,
    );

    service = container.resolve(CreateUserService);

    jest.clearAllMocks();

    (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('password'));
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
  });

  it('should create user successfully', async () => {
    const dto = {
      firstName: 'John',
      middleName: null,
      lastName: 'Doe',
      suffix: null,
      email: 'john@example.com',
      roleId: 2,
      token: null,
    };

    userRepo.findOne.mockResolvedValue(null);
    roleRepo.findOne.mockResolvedValue(mockRole);

    userRepo.create.mockReturnValue(mockUser);
    userRepo.save.mockResolvedValue(mockUser);

    const authUser: JwtUserPayload = {
      sub: 99,
      email: 'admin@test.com',
      roles: [RoleEnum.SUPERADMIN],
      firstName: 'Admin',
      lastName: 'User',
      emailVerifiedAt: null,
      iat: 0,
      exp: 0,
      iss: 'test',
      aud: 'test',
    };

    const result = await service.handle(dto, authUser);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { email: dto.email },
    });

    expect(roleRepo.findOne).toHaveBeenCalledWith({
      where: { id: dto.roleId },
    });

    expect(userRepo.create).toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalled();

    expect(emailNotification.send).toHaveBeenCalled();

    expect(auditService.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'USER_CREATED',
        auditableId: mockUser.id,
      }),
    );

    expect(result.email).toBe(dto.email);
    expect(result.role).toBe(mockRole.name);
  });

  it('should throw ValidationException if email already exists', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);

    await expect(
      service.handle({
        firstName: 'John',
        middleName: null,
        lastName: 'Doe',
        suffix: null,
        email: 'john@example.com',
        roleId: 2,
        token: null
      }),
    ).rejects.toBeInstanceOf(ValidationException);

    expect(userRepo.create).not.toHaveBeenCalled();
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if role does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);
    roleRepo.findOne.mockResolvedValue(null);

    await expect(
      service.handle({
        firstName: 'John',
        middleName: null,
        lastName: 'Doe',
        suffix: null,
        email: 'john@example.com',
        roleId: 999,
        token: null
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should throw ValidationException if role is SUPERADMIN', async () => {
    userRepo.findOne.mockResolvedValue(null);

    roleRepo.findOne.mockResolvedValue({
      id: 1,
      code: RoleEnum.SUPERADMIN,
    } as Role);

    await expect(
      service.handle({
        firstName: 'John',
        middleName: null,
        lastName: 'Doe',
        suffix: null,
        email: 'john@example.com',
        roleId: 1,
        token: null
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('should process invitation token if provided', async () => {
    const invitation = {
      token: 'abc123',
      joinedAt: null,
      userId: null,
    } as InvitationRequest;

    userRepo.findOne.mockResolvedValue(null);
    roleRepo.findOne.mockResolvedValue(mockRole);

    userRepo.create.mockReturnValue(mockUser);
    userRepo.save.mockResolvedValue(mockUser);

    invitationRepo.findOne.mockResolvedValue(invitation);

    await service.handle({
      firstName: 'John',
      middleName: null,
      lastName: 'Doe',
      suffix: null,
      email: 'john@example.com',
      roleId: 2,
      token: 'abc123',
    });

    expect(invitationRepo.save).toHaveBeenCalled();
  });
});