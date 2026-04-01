import 'reflect-metadata';
import { container } from 'tsyringe';
import { DeleteInventoryService } from '@/services/inventories/DeleteInventoryService';
import { Inventory } from '@/entities/Inventory';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('DeleteInventoryService', () => {
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: DeleteInventoryService;

  const existingInventory = {
    id: 1,
    productId: 100,
    locationId: 200,
    storedQuantity: 50,
  } as Inventory;

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
    inventoryRepo = {
      findOne: jest.fn(),
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('InventoryRepository', inventoryRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(DeleteInventoryService);

    jest.clearAllMocks();
  });

  it('should soft delete an inventory successfully', async () => {
    inventoryRepo.findOne.mockResolvedValue(existingInventory);
    inventoryRepo.softRemove.mockImplementation((inv) =>
      Promise.resolve({ ...existingInventory, ...inv } as Inventory)
    );

    const result = await service.handle(existingInventory.id, user);

    // Repository calls
    expect(inventoryRepo.findOne).toHaveBeenCalledWith({ where: { id: existingInventory.id } });
    expect(inventoryRepo.softRemove).toHaveBeenCalledWith(existingInventory);

    // Audit log
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'INVENTORY_DELETED',
      auditableType: 'Inventory',
      auditableId: existingInventory.id,
      userId: user.sub,
      oldValues: existingInventory,
    }));

    expect(result).toEqual(existingInventory);
  });

  it('should throw NotFoundException if inventory does not exist', async () => {
    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, user))
      .rejects
      .toThrow(NotFoundException);

    expect(inventoryRepo.softRemove).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});