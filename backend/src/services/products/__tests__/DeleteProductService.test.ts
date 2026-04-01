import 'reflect-metadata';
import { container } from 'tsyringe';
import { DeleteProductService } from '@/services/products/DeleteProductService';
import { Product } from '@/entities/Product';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('DeleteProductService', () => {
  let productRepo: jest.Mocked<Repository<Product>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: DeleteProductService;

  const existingProduct = {
    id: 1,
    sku: 'SKU123',
    name: 'Test Product',
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
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('ProductRepository', productRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(DeleteProductService);

    jest.clearAllMocks();
  });

  it('should soft delete a product successfully', async () => {
    productRepo.findOne.mockResolvedValue(existingProduct);
    productRepo.softRemove.mockImplementation((p) =>
        Promise.resolve({
            ...existingProduct, // ensures id, sku, etc. are present
            ...p,               // include any updates from the call
        } as Product)
    );

    const result = await service.handle(existingProduct.id, user);

    // Repository calls
    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: existingProduct.id } });
    expect(productRepo.softRemove).toHaveBeenCalledWith(existingProduct);

    // Audit log
    expect(auditService.handle).toHaveBeenCalledWith(expect.objectContaining({
      event: 'PRODUCT_DELETED',
      auditableId: existingProduct.id,
      userId: user.sub,
      oldValues: existingProduct,
    }));

    expect(result).toEqual(existingProduct);
  });

  it('should throw NotFoundException if product does not exist', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, user))
      .rejects
      .toThrow(NotFoundException);

    expect(productRepo.softRemove).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});