import 'reflect-metadata';
import { container } from 'tsyringe';
import { GetInventoryService } from '@/services/inventories/GetInventoryService';
import { Inventory } from '@/entities/Inventory';
import { Repository } from 'typeorm';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { Product } from '@/entities/Product';
import { Location } from '@/entities/Location';

describe('GetInventoryService', () => {
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let service: GetInventoryService;

  const existingInventory = {
    id: 1,
    productId: 10,
    locationId: 20,
    storedQuantity: 50,
    product: { id: 10, name: 'Product A', sku: 'SKU001' } as Product,
    location: { id: 20, name: 'Warehouse 1', code: 'LOC001' } as Location,
  } as Inventory;

  beforeEach(() => {
    inventoryRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Inventory>>;

    container.registerInstance('InventoryRepository', inventoryRepo);

    service = container.resolve(GetInventoryService);

    jest.clearAllMocks();
  });

  it('should return an inventory successfully', async () => {
    inventoryRepo.findOne.mockResolvedValue(existingInventory);

    const result = await service.handle(existingInventory.id);

    expect(inventoryRepo.findOne).toHaveBeenCalledWith({
      where: { id: existingInventory.id },
      relations: ['product', 'location'],
    });
    expect(result).toEqual(existingInventory);
  });

  it('should throw NotFoundException if inventory does not exist', async () => {
    inventoryRepo.findOne.mockResolvedValue(null);

    await expect(service.handle(999)).rejects.toThrow(NotFoundException);

    expect(inventoryRepo.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
      relations: ['product', 'location'],
    });
  });
});
