import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetProductService } from '@/services/products/GetProductService';
import { Product } from '@/entities/Product';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';

describe('GetProductService', () => {
  let productRepo: jest.Mocked<Repository<Product>>;
  let service: GetProductService;

  const existingProduct = {
    id: 1,
    sku: 'SKU123',
    name: 'Test Product',
  } as Product;

  beforeEach(() => {
    productRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    container.registerInstance('ProductRepository', productRepo);

    service = container.resolve(GetProductService);

    jest.clearAllMocks();
  });

  it('should return a product successfully', async () => {
    // Mock the repository to return the product
    productRepo.findOne.mockResolvedValue(existingProduct);

    const result = await service.handle(existingProduct.id);

    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: existingProduct.id } });
    expect(result).toEqual(existingProduct);
  });

  it('should throw NotFoundException if product does not exist', async () => {
    // Mock the repository to return null
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(productRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
  });
});