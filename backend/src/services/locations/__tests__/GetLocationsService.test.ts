import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetLocationsService } from '@/services/locations/GetLocationsService';
import { Location } from '@/entities/Location';

describe('GetLocationsService', () => {
  let locationRepo: Repository<Location>;
  let service: GetLocationsService;
  let qb: jest.Mocked<SelectQueryBuilder<Location>>;

  const mockLocations: Location[] = [
    {
      id: 1,
      code: 'LOC001',
      name: 'Location 1',
      type: 'Warehouse',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      capacity: '1000',
      inventories: [],
      movementsFrom: [],
      movementsTo: [],
    } as Location,
  ];

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Location>>;

    locationRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<Location>;

    container.registerInstance('LocationRepository', locationRepo);
    service = container.resolve(GetLocationsService);

    jest.clearAllMocks();
  });

  it('should return paginated locations', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLocations, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(locationRepo.createQueryBuilder).toHaveBeenCalledWith('location');
    expect(qb.orderBy).toHaveBeenCalledWith('location.id', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual(mockLocations);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters when provided', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLocations, 1]);

    const req = {
      query: { id: 1, code: 'LOC001', name: 'Location 1', type: 'Warehouse', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('location.id = :id', { id: 1 });
    expect(qb.andWhere).toHaveBeenCalledWith('location.code ILIKE :code', { code: '%LOC001%' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.name ILIKE :name', { name: '%Location 1%' });
    expect(qb.andWhere).toHaveBeenCalledWith('location.type ILIKE :type', { type: '%Warehouse%' });
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLocations, 1]);

    const req = { query: { search: 'LOC', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('location.code ILIKE :search'),
      { search: '%LOC%' }
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLocations, 1]);

    const req = { query: { sortBy: 'name', sortDirection: 'ASC', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('location.name', 'ASC');
  });

  it('should fallback to id sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockLocations, 1]);

    const req = { query: { sortBy: 'invalidColumn', page: 1, limit: 10 } } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('location.id', 'DESC');
  });
});