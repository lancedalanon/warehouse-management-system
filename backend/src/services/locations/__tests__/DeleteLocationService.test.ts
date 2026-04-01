import 'reflect-metadata';
import { container } from 'tsyringe';
import { DeleteLocationService } from '@/services/locations/DeleteLocationService';
import { Location } from '@/entities/Location';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('DeleteLocationService', () => {
  let locationRepo: jest.Mocked<Repository<Location>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: DeleteLocationService;

  const existingLocation = {
    id: 1,
    code: 'LOC123',
    name: 'Test Location',
  } as Location;

  const user: JwtUserPayload = {
    sub: 1,
    email: 'test@example.com',
    roles: [],
    emailVerifiedAt: null,
    firstName: 'John',
    lastName: 'Doe',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'test-issuer',
    aud: 'test-audience',
  };

  beforeEach(() => {
    locationRepo = {
      findOne: jest.fn(),
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<Location>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('LocationRepository', locationRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(DeleteLocationService);

    jest.clearAllMocks();
  });

  it('should soft delete a location successfully', async () => {
    locationRepo.findOne.mockResolvedValue(existingLocation);
    locationRepo.softRemove.mockImplementation((l) =>
      Promise.resolve({ ...existingLocation, ...l } as Location)
    );

    const result = await service.handle(existingLocation.id, user);

    // Repository calls
    expect(locationRepo.findOne).toHaveBeenCalledWith({ where: { id: existingLocation.id } });
    expect(locationRepo.softRemove).toHaveBeenCalledWith(existingLocation);

    // Audit log
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'LOCATION_DELETED',
      auditableId: existingLocation.id,
      userId: user.sub,
      oldValues: existingLocation,
    }));

    expect(result).toEqual(existingLocation);
  });

  it('should throw NotFoundException if location does not exist', async () => {
    locationRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, user))
      .rejects
      .toThrow(NotFoundException);

    expect(locationRepo.softRemove).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});