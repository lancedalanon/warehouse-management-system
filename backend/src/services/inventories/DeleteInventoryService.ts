import { Repository } from 'typeorm';
import { Inventory } from '@/entities/Inventory';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class DeleteInventoryService implements BaseService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,

    @inject('InventoryRepository')
    private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  async handle(id: number, user?: JwtUserPayload): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({ where: { id } });
    if (!inventory)
      throw new NotFoundException(`Inventory with id ${id} not found`);

    await this.inventoryRepo.softRemove(inventory);

    // Create audit log
    await this.createAuditLogService.handle({
      event: 'INVENTORY_DELETED',
      description: `Inventory deleted with product id ${inventory.productId}`,
      auditableType: 'Inventory',
      auditableId: inventory.id,
      userId: user?.sub,
      oldValues: { ...inventory },
    });

    return inventory;
  }
}
