import 'reflect-metadata';
import { container } from 'tsyringe';
import { UpdateUserService } from '@/services/users/UpdateUserService';
import { User } from '@/entities/User';
import { Role } from '@/entities/Role';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { Role as RoleEnum } from '@/enums/Role';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ValidationException } from '@/exceptions/ValidationException';

describe('UpdateUserService', () => {
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: UpdateUserService;

  const existingRole = {
    id: 2,
    name: 'User',
    code: 'USER',
  } as Role;

  const existingUser = {
    id: 1,
    firstName: 'John',
    middleName: null,
    lastName: 'Doe',
    suffix: null,
    email: 'john@example.com',
    emailVerifiedAt: new Date(),
    roles: [existingRole],
  } as User;

  const user: JwtUserPayload = {
    sub: 1,
    email: 'admin@example.com',
    roles: [RoleEnum.SUPERADMIN],
    emailVerifiedAt: null,
    firstName: 'Admin',
    lastName: 'User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'test',
    aud: 'test',
  };

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    roleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Role>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('UserRepository', userRepo);
    container.registerInstance('RoleRepository', roleRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(UpdateUserService);

    jest.clearAllMocks();
  });

  it('should update user successfully', async () => {
    const dto = {
      firstName: 'Jane',
      middleName: null,
      lastName: 'Smith',
      suffix: null,
      email: 'jane@example.com',
      roleId: existingRole.id,
    };

    userRepo.findOne.mockImplementation(({ where } = {}) => {
      if (where && 'id' in where && where.id === existingUser.id) {
        return Promise.resolve(existingUser);
      }
      if (where && 'email' in where) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    roleRepo.findOne.mockResolvedValue(existingRole);

    const savedUser = { ...existingUser, ...dto, roles: [existingRole] };
    userRepo.save.mockResolvedValue(savedUser);

    const result = await service.handle(existingUser.id, dto, user);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: existingUser.id },
      relations: ['roles'],
    });

    expect(roleRepo.findOne).toHaveBeenCalledWith({
      where: { id: dto.roleId },
    });

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        suffix: dto.suffix,
        email: dto.email,
        roles: [existingRole],
      }),
    );

    expect(auditService.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'USER_UPDATED',
        auditableId: existingUser.id,
      }),
    );

    expect(result).toEqual(savedUser);
  });

  it('should throw NotFoundException if user does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.handle(
        999,
        {
          firstName: 'Test',
          middleName: null,
          lastName: 'User',
          suffix: null,
          email: 'test@example.com',
          roleId: 2,
        },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(userRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if email already exists', async () => {
    userRepo.findOne
      .mockResolvedValueOnce(existingUser) // find user
      .mockResolvedValueOnce({ ...existingUser, id: 2 }); // conflicting email

    const dto = {
      firstName: 'John',
      middleName: null,
      lastName: 'Doe',
      suffix: null,
      email: 'conflict@example.com',
      roleId: 2,
    };

    await expect(
      service.handle(existingUser.id, dto, user),
    ).rejects.toBeInstanceOf(ValidationException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if role does not exist', async () => {
    userRepo.findOne.mockResolvedValue(existingUser);
    roleRepo.findOne.mockResolvedValue(null);

    const dto = {
      firstName: 'John',
      middleName: null,
      lastName: 'Doe',
      suffix: null,
      email: 'john@example.com',
      roleId: 999,
    };

    await expect(
      service.handle(existingUser.id, dto, user),
    ).rejects.toBeInstanceOf(ValidationException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if role is SUPERADMIN', async () => {
    userRepo.findOne.mockResolvedValue(existingUser);

    roleRepo.findOne.mockResolvedValue({
      id: 1,
      code: RoleEnum.SUPERADMIN,
    } as Role);

    const dto = {
      firstName: 'John',
      middleName: null,
      lastName: 'Doe',
      suffix: null,
      email: 'john@example.com',
      roleId: 1,
    };

    await expect(
      service.handle(existingUser.id, dto, user),
    ).rejects.toBeInstanceOf(ValidationException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });
});
