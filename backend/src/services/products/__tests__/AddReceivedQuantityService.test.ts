import 'reflect-metadata';
import { container } from 'tsyringe';
import { AddReceivedQuantityService } from '@/services/products/AddReceivedQuantityService';
import { Product } from '@/entities/Product';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { CreateInventoryMovementService } from '@/services/inventory-movements/CreateInventoryMovementService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { InventoryStatus } from '@/enums/InventoryStatus';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('AddReceivedQuantityService', () => {
  let productRepo: jest.Mocked<Repository<Product>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let inventoryMovementService: jest.Mocked<CreateInventoryMovementService>;
  let service: AddReceivedQuantityService;

  const existingProduct = {
    id: 1,
    sku: 'SKU123',
    receivedQuantity: 10,
  } as Product;

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
    productRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;
    inventoryMovementService = { handle: jest.fn() } as unknown as jest.Mocked<CreateInventoryMovementService>;

    container.registerInstance('ProductRepository', productRepo);
    container.registerInstance(CreateAuditLogService, auditService);
    container.registerInstance(CreateInventoryMovementService, inventoryMovementService);

    service = container.resolve(AddReceivedQuantityService);

    jest.clearAllMocks();
  });

  it('should add received quantity successfully', async () => {
    const dto = { quantity: 5 };

    productRepo.findOne.mockResolvedValue(existingProduct);
    productRepo.save.mockImplementation((p) =>
        Promise.resolve({
            ...existingProduct,
            ...p,
        } as Product)
    );

    const result = await service.handle(existingProduct.id, dto, user);

    // Product find and save
    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: existingProduct.id } });
    expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ receivedQuantity: 15 }));

    // Inventory movement
    expect(inventoryMovementService.handle).toHaveBeenCalledWith(expect.objectContaining({
      productId: existingProduct.id,
      quantity: dto.quantity,
      fromState: InventoryStatus.EXTERNAL,
      toState: InventoryStatus.RECEIVED,
    }));

    // Audit log
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'PRODUCT_RECEIVED',
      auditableId: existingProduct.id,
      userId: user.sub,
    }));

    expect(result.receivedQuantity).toBe(15);
  });

  it('should throw NotFoundException if product does not exist', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, { quantity: 5 }, user))
      .rejects
      .toThrow(NotFoundException);

    expect(productRepo.save).not.toHaveBeenCalled();
    expect(inventoryMovementService.handle).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});