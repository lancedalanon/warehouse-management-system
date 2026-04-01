import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetRoleService } from '@/services/roles/GetRoleService';
import { Role } from '@/entities/Role';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { Role as RoleCode } from '@/enums/Role';

describe('GetRoleService', () => {
  let roleRepo: jest.Mocked<Repository<Role>>;
  let service: GetRoleService;

  const mockRole = {
    id: 1,
    name: 'User',
    code: 'USER',
  } as Role;

  beforeEach(() => {
    roleRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Role>>;

    container.registerInstance('RoleRepository', roleRepo);

    service = container.resolve(GetRoleService);

    jest.clearAllMocks();
  });

  it('should return the role successfully', async () => {
    roleRepo.findOne.mockResolvedValue(mockRole);

    const result = await service.handle(mockRole.id);

    expect(roleRepo.findOne).toHaveBeenCalledWith({
      where: { id: mockRole.id },
    });

    expect(result).toEqual(mockRole);
  });

  it('should throw NotFoundException if role does not exist', async () => {
    roleRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(roleRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
    });
  });

  it('should throw NotFoundException if role is SUPERADMIN', async () => {
    const superadminRole = {
      id: 2,
      name: 'Super Admin',
      code: RoleCode.SUPERADMIN,
    } as Role;

    roleRepo.findOne.mockResolvedValue(superadminRole);

    await expect(service.handle(superadminRole.id)).rejects.toThrow(
      NotFoundException,
    );

    expect(roleRepo.findOne).toHaveBeenCalledWith({
      where: { id: superadminRole.id },
    });
  });
});