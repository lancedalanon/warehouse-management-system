import 'reflect-metadata';
import { container } from 'tsyringe';
import { UpdateLocationService } from '@/services/locations/UpdateLocationService';
import { Location } from '@/entities/Location';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ValidationException } from '@/exceptions/ValidationException';

describe('UpdateLocationService', () => {
  let locationRepo: jest.Mocked<Repository<Location>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: UpdateLocationService;

  const existingLocation = {
    id: 1,
    code: 'LOC001',
    name: 'Main Warehouse',
    type: 'Warehouse',
    capacity: '100 kg',
  } as Location;

  const user: JwtUserPayload = {
    sub: 1,
    email: 'admin@example.com',
    roles: [],
    emailVerifiedAt: null,
    firstName: 'Admin',
    lastName: 'User',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'test-issuer',
    aud: 'test-audience',
  };

  beforeEach(() => {
    locationRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Location>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('LocationRepository', locationRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(UpdateLocationService);

    jest.clearAllMocks();
  });

  it('should update location successfully', async () => {
    const dto = {
      code: 'LOC002',
      name: 'Updated Warehouse',
      type: 'Warehouse',
      capacity: '200 kg',
    };

    locationRepo.findOne.mockImplementation(({ where }) => {
      if (where && 'id' in where && where.id === existingLocation.id) {
        return Promise.resolve(existingLocation);
      }
      if (where && 'code' in where) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    locationRepo.save.mockResolvedValue({ ...existingLocation, ...dto });

    const result = await service.handle(existingLocation.id, dto, user);

    expect(locationRepo.findOne).toHaveBeenCalledWith({
      where: { id: existingLocation.id },
    });
    expect(locationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining(dto),
    );
    expect(auditService.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        auditableId: existingLocation.id,
        event: 'LOCATION_UPDATED',
      }),
    );
    expect(result).toEqual({ ...existingLocation, ...dto });
  });

  it('should throw NotFoundException if location does not exist', async () => {
    locationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.handle(
        999,
        { code: 'LOC999', name: 'X', type: 'Warehouse', capacity: null },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(locationRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if code already exists', async () => {
    locationRepo.findOne
      .mockResolvedValueOnce(existingLocation) // find current product
      .mockResolvedValueOnce({ ...existingLocation, id: 2, code: 'SKU999' }); // find conflicting SKU

    const dto = {
      code: 'SKU999',
      name: 'Updated Warehouse',
      type: 'Warehouse',
      capacity: '200 kg',
    };

    await expect(
      service.handle(existingLocation.id, dto, user),
    ).rejects.toBeInstanceOf(ValidationException);

    expect(locationRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});
