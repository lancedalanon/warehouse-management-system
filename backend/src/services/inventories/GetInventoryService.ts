import { Repository } from 'typeorm';
import { Inventory } from '@/entities/Inventory';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';

@injectable()
export class GetInventoryService implements BaseService {
  constructor(
    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  async handle(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({
      where: { id },
      relations: ['product', 'location'],
    });

    if (!inventory)
      throw new NotFoundException(`Inventory with id ${id} not found`);

    return inventory;
  }
}
