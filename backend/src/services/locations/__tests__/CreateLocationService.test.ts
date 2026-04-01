import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateLocationService } from '@/services/locations/CreateLocationService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { Location } from '@/entities/Location';
import { Repository } from 'typeorm';
import { JwtUserPayload } from '@/types/middlewares/express';
import { ValidationException } from '@/exceptions/ValidationException';

describe('CreateLocationService', () => {
  let locationRepo: jest.Mocked<Repository<Location>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: CreateLocationService;

  const mockLocation = {
    id: 1,
    code: 'LOC001',
    name: 'Main Warehouse',
    type: 'Warehouse',
    capacity: '100 kg',
  } as Location;

  beforeEach(() => {
    locationRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Location>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('LocationRepository', locationRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(CreateLocationService);

    jest.clearAllMocks();
  });

  it('should create location successfully', async () => {
    const dto = { code: 'LOC001', name: 'Main Warehouse', type: 'Warehouse', capacity: '100 kg' };

    locationRepo.findOne.mockResolvedValue(null);
    locationRepo.create.mockReturnValue(mockLocation);
    locationRepo.save.mockResolvedValue(mockLocation);

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

    const result = await service.handle(dto, user);

    expect(locationRepo.findOne).toHaveBeenCalledWith({ where: { code: 'LOC001' }, withDeleted: true });
    expect(locationRepo.create).toHaveBeenCalledWith(dto);
    expect(locationRepo.save).toHaveBeenCalledWith(mockLocation);
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'LOCATION_CREATED',
      auditableType: 'Location',
      auditableId: 1,
      userId: 1,
      newValues: expect.objectContaining({ code: 'LOC001' }),
    }));
    expect(result).toEqual(mockLocation);
  });

  it('should throw ValidationException if code exists', async () => {
    locationRepo.findOne.mockResolvedValue(mockLocation);

    const dto = { code: 'LOC001', name: 'Another Location', type: 'Warehouse', capacity: '50 kg' };

    await expect(service.handle(dto)).rejects.toBeInstanceOf(ValidationException);

    expect(locationRepo.create).not.toHaveBeenCalled();
    expect(locationRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should set capacity to null when not provided', async () => {
    const dto = { code: 'LOC003', name: 'Tertiary Warehouse', type: 'Bin', capacity: null };
    const locationWithNullCapacity = { ...mockLocation, id: 3, code: 'LOC003', name: 'Tertiary Warehouse', capacity: null };

    locationRepo.findOne.mockResolvedValue(null);
    locationRepo.create.mockReturnValue(locationWithNullCapacity as Location);
    locationRepo.save.mockResolvedValue(locationWithNullCapacity as Location);

    const result = await service.handle(dto);

    expect(locationRepo.create).toHaveBeenCalledWith({
      ...dto,
      capacity: null,
    });
    expect(result.capacity).toBeNull();
  });
});