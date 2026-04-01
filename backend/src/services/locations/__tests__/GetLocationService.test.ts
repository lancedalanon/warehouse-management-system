import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetLocationService } from '@/services/locations/GetLocationService';
import { Location } from '@/entities/Location';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('GetLocationService', () => {
  let locationRepo: jest.Mocked<Repository<Location>>;
  let service: GetLocationService;

  const existingLocation = {
    id: 1,
    code: 'LOC123',
    name: 'Test Location',
  } as Location;

  beforeEach(() => {
    locationRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Location>>;

    container.registerInstance('LocationRepository', locationRepo);

    service = container.resolve(GetLocationService);

    jest.clearAllMocks();
  });

  it('should return a location successfully', async () => {
    locationRepo.findOne.mockResolvedValue(existingLocation);

    const result = await service.handle(existingLocation.id);

    expect(locationRepo.findOne).toHaveBeenCalledWith({
      where: { id: existingLocation.id },
    });
    expect(result).toEqual(existingLocation);
  });

  it('should throw NotFoundException if location does not exist', async () => {
    locationRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(locationRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
  });
});
