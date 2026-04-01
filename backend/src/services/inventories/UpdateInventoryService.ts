import { AppDataSource } from '@/data-source';
import { Inventory } from '@/entities/Inventory';
import { UpdateInventoryDTO } from '@/schemas/inventories/UpdateInventorySchema';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { inject, injectable } from 'tsyringe';
import { JwtUserPayload } from '@/types/middlewares/express';
import { InventoryAction } from '@/enums/InventoryAction';
import { BadRequestException } from '@/exceptions/BadRequestException';
import { StoreInventoryService } from './StoreInventoryService';
import { TransferInventoryService } from './TransferInventoryService';
import { WriteOffInventoryService } from './WriteOffInventoryService';

@injectable()
export class UpdateInventoryService implements BaseService {
  constructor(
    @inject(StoreInventoryService)
    private readonly storeInventoryService: StoreInventoryService,

    @inject(TransferInventoryService)
    private readonly transferService: TransferInventoryService,

    @inject(WriteOffInventoryService)
    private readonly writeOffService: WriteOffInventoryService,
  ) {}

  async handle(
    id: number,
    data: UpdateInventoryDTO,
    user?: JwtUserPayload,
  ): Promise<Inventory> {
    const inventory = await AppDataSource.getRepository(Inventory).findOne({
      where: { id },
      relations: ['product', 'location'],
      withDeleted: true,
    });
    if (!inventory) throw new NotFoundException('Inventory not found');

    switch (data.action) {
      case InventoryAction.STORE:
        return this.storeInventoryService.handle(inventory, data, user);
      case InventoryAction.TRANSFER:
        return this.transferService.handle(inventory, data, user);
      case InventoryAction.WRITE_OFF:
        return this.writeOffService.handle(inventory, data, user);
      default:
        throw new BadRequestException('Invalid inventory action');
    }
  }
}
