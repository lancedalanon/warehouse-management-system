import 'reflect-metadata';
import { container } from 'tsyringe';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Request } from 'express';
import { GetInventoryMovementsService } from '@/services/inventory-movements/GetInventoryMovementsService';
import { InventoryMovement } from '@/entities/InventoryMovement';

describe('GetInventoryMovementsService', () => {
  let movementRepo: Repository<InventoryMovement>;
  let service: GetInventoryMovementsService;
  let qb: jest.Mocked<SelectQueryBuilder<InventoryMovement>>;

  const mockMovements: InventoryMovement[] = [
    {
      id: 1,
      quantity: 5,
      fromState: 'received',
      toState: 'stored',
      fromLocationId: 1,
      toLocationId: 2,
    } as InventoryMovement,
  ];

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<InventoryMovement>>;

    movementRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as Repository<InventoryMovement>;

    container.registerInstance('InventoryMovementRepository', movementRepo);
    service = container.resolve(GetInventoryMovementsService);

    jest.clearAllMocks();
  });

  it('should return paginated inventory movements', async () => {
    qb.getManyAndCount.mockResolvedValue([mockMovements, 1]);

    const req = { query: { page: 1, limit: 10 } } as unknown as Request;

    const result = await service.handle(req);

    expect(movementRepo.createQueryBuilder).toHaveBeenCalledWith('movement');
    expect(qb.leftJoinAndSelect).toHaveBeenCalled();
    expect(qb.orderBy).toHaveBeenCalledWith('movement.createdAt', 'DESC');
    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.data).toEqual(mockMovements);
    expect(result.meta.totalCount).toBe(1);
  });

  it('should apply filters for id, inventoryId, fromState, toState, fromLocationId, toLocationId', async () => {
    qb.getManyAndCount.mockResolvedValue([mockMovements, 1]);

    const req = {
      query: {
        id: 1,
        inventoryId: 2,
        fromState: 'received',
        toState: 'stored',
        fromLocationId: 1,
        toLocationId: 2,
        page: 1,
        limit: 10,
      },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith('movement.id = :id', { id: 1 });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'movement.inventoryId = :inventoryId',
      { inventoryId: 2 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'movement.fromState ILIKE :fromState',
      { fromState: '%received%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'movement.toState ILIKE :toState',
      { toState: '%stored%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'movement.fromLocationId = :fromLocationId',
      { fromLocationId: 1 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'movement.toLocationId = :toLocationId',
      { toLocationId: 2 },
    );
  });

  it('should apply global search', async () => {
    qb.getManyAndCount.mockResolvedValue([mockMovements, 1]);

    const req = {
      query: { search: 'test', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('movement.type ILIKE :search'),
      { search: '%test%' },
    );
  });

  it('should apply custom sorting', async () => {
    qb.getManyAndCount.mockResolvedValue([mockMovements, 1]);

    const req = {
      query: { sortBy: 'quantity', sortDirection: 'ASC', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('movement.quantity', 'ASC');
  });

  it('should fallback to createdAt sorting when sortBy is invalid', async () => {
    qb.getManyAndCount.mockResolvedValue([mockMovements, 1]);

    const req = {
      query: { sortBy: 'invalidColumn', page: 1, limit: 10 },
    } as unknown as Request;

    await service.handle(req);

    expect(qb.orderBy).toHaveBeenCalledWith('movement.createdAt', 'DESC');
  });

  it('should cap limit to 100 when exceeding maximum', async () => {
    qb.getManyAndCount.mockResolvedValue([mockMovements, 1]);

    const req = { query: { page: 1, limit: 500 } } as unknown as Request;

    await service.handle(req);

    expect(qb.take).toHaveBeenCalledWith(100);
  });
});
