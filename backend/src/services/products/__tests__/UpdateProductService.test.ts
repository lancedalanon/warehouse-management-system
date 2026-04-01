import 'reflect-metadata';
import { container } from 'tsyringe';
import { UpdateProductService } from '@/services/products/UpdateProductService';
import { Product } from '@/entities/Product';
import { Repository } from 'typeorm';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { Role } from '@/enums/Role';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { ValidationException } from '@/exceptions/ValidationException';

describe('UpdateProductService', () => {
  let productRepo: jest.Mocked<Repository<Product>>;
  let auditService: jest.Mocked<CreateAuditLogService>;
  let service: UpdateProductService;

  const existingProduct = {
    id: 1,
    sku: 'SKU123',
    name: 'Existing Product',
    description: 'Existing description',
    unitType: 'pcs',
  } as Product;

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

  beforeEach(() => {
    // Mock repository methods
    productRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    auditService = { handle: jest.fn() } as unknown as jest.Mocked<CreateAuditLogService>;

    container.registerInstance('ProductRepository', productRepo);
    container.registerInstance(CreateAuditLogService, auditService);

    service = container.resolve(UpdateProductService);

    jest.clearAllMocks();
  });

  it('should update a product successfully', async () => {
    const dto = {
      sku: 'SKU456',
      name: 'Updated Product',
      description: 'Updated description',
      unitType: 'box'
    };

    productRepo.findOne.mockImplementation(({ where } = {}) => {
      if (where && 'id' in where && where.id === existingProduct.id) {
        return Promise.resolve(existingProduct); // fetching by id
      }
      if (where && 'sku' in where) {
        return Promise.resolve(null); // no SKU conflict
      }
      return Promise.resolve(null); // fallback
    });
    productRepo.save.mockResolvedValue({ ...existingProduct, ...dto });

    const result = await service.handle(existingProduct.id, dto, user);

    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: existingProduct.id } });
    expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining(dto));
    expect(auditService.handle).toHaveBeenCalledWith(
    expect.objectContaining({ 
      auditableId: existingProduct.id,
        event: 'PRODUCT_UPDATED'
    }));
    expect(result).toEqual({ ...existingProduct, ...dto });
  });

  it('should throw NotFoundException if product does not exist', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999, { sku: 'SKU999', name: 'X', unitType: 'pcs', description: null }, user))
      .rejects.toBeInstanceOf(NotFoundException);

    expect(productRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });

  it('should throw ValidationException if SKU already exists', async () => {
    productRepo.findOne
      .mockResolvedValueOnce(existingProduct) // find current product
      .mockResolvedValueOnce({ ...existingProduct, id: 2, sku: 'SKU999' }); // find conflicting SKU

    const dto = { sku: 'SKU999', name: 'Updated', description: 'Desc', unitType: 'pcs' };

    await expect(service.handle(existingProduct.id, dto, user))
      .rejects.toBeInstanceOf(ValidationException);

    expect(productRepo.save).not.toHaveBeenCalled();
    expect(auditService.handle).not.toHaveBeenCalled();
  });
});