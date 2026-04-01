import 'reflect-metadata';
import { container } from 'tsyringe';
import { DeleteUserService } from '@/services/users/DeleteUserService';
import { User } from '@/entities/User';
import { Repository, Not } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { Role as RoleEnum } from '@/enums/Role';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('DeleteUserService', () => {
  let userRepo: jest.Mocked<Repository<User>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: DeleteUserService;

  const existingUser = {
    id: 1,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
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
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('UserRepository', userRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(DeleteUserService);

    jest.clearAllMocks();
  });

  it('should soft delete a user successfully', async () => {
    userRepo.findOne.mockResolvedValue(existingUser);

    userRepo.softRemove.mockImplementation((u) =>
      Promise.resolve({
        ...existingUser,
        ...u,
      } as User),
    );

    const result = await service.handle(existingUser.id, user);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: existingUser.id,
        roles: {
          code: Not(RoleEnum.SUPERADMIN),
        },
      },
    });

    expect(userRepo.softRemove).toHaveBeenCalledWith(existingUser);

    expect(auditService.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'USER_DELETED',
        auditableId: existingUser.id,
        userId: user.sub,
        oldValues: existingUser,
      }),
    );

    expect(result).toEqual(existingUser);
  });

  it('should throw NotFoundException if user does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, user))
      .rejects
      .toThrow(NotFoundException);

    expect(userRepo.softRemove).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});