import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateProductService } from '@/services/products/CreateProductService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { CreateInventoryMovementService } from '@/services/inventory-movements/CreateInventoryMovementService';
import { Product } from '@/entities/Product';
import { Repository } from 'typeorm';
import { JwtUserPayload } from '@/types/middlewares/express';
import { Role } from '@/enums/Role';
import { ValidationException } from '@/exceptions/ValidationException';

describe('CreateProductService', () => {
  let productRepo: jest.Mocked<Repository<Product>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let movementService: jest.Mocked<CreateInventoryMovementService>;
  let service: CreateProductService;

  const mockProduct = {
    id: 1,
    sku: 'SKU123',
    name: 'Test Product',
    description: 'Test',
    unitType: 'pcs',
    receivedQuantity: 10,
  } as Product;

  beforeEach(() => {
    // Create mocks
    productRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    auditService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateAuditLogService>;
    movementService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<CreateInventoryMovementService>;

    // Register instances in tsyringe container
    container.registerInstance('ProductRepository', productRepo);
    container.registerInstance(CreateAuditLogService, auditService);
    container.registerInstance(CreateInventoryMovementService, movementService);

    // Resolve the service
    service = container.resolve(CreateProductService);

    jest.clearAllMocks();
  });

  it('should create product successfully', async () => {
    const dto = {
      sku: 'SKU123',
      name: 'Test Product',
      unitType: 'pcs',
      receivedQuantity: 10,
      notes: null,
      description: null,
    };

    productRepo.findOne.mockResolvedValue(null);
    productRepo.create.mockReturnValue(mockProduct);
    productRepo.save.mockResolvedValue(mockProduct);

    const user: JwtUserPayload = {
      sub: 1,
      email: 'test@example.com',
      roles: [Role.SUPERADMIN],
      emailVerifiedAt: null,
      firstName: 'John',
      lastName: 'Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'test-issuer',
      aud: 'test-audience',
    };

    const result = await service.handle(dto, user);

    expect(productRepo.findOne).toHaveBeenCalledWith({
      where: { sku: 'SKU123' },
      withDeleted: true,
    });
    expect(productRepo.create).toHaveBeenCalled();
    expect(productRepo.save).toHaveBeenCalled();
    expect(movementService.handle).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 1 }),
    );
    expect(auditService.handle).toHaveBeenCalledWith(
      expect.objectContaining({ auditableId: 1 }),
    );
    expect(result).toEqual(mockProduct);
  });

  it('should throw ValidationException if SKU exists', async () => {
    productRepo.findOne.mockResolvedValue(mockProduct);

    await expect(
      service.handle({
        sku: 'SKU123',
        name: 'Another',
        unitType: 'pcs',
        receivedQuantity: 5,
        notes: null,
        description: null,
      }),
    ).rejects.toBeInstanceOf(ValidationException);

    expect(productRepo.create).not.toHaveBeenCalled();
    expect(productRepo.save).not.toHaveBeenCalled();
    expect(movementService.handle).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});
