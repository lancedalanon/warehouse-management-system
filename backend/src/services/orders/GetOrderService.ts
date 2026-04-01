import { Repository } from 'typeorm';
import { inject, injectable } from 'tsyringe';
import { Order } from '@/entities/Order';
import { BaseService } from '@/services/BaseService';
import { NotFoundException } from '@/exceptions/NotFoundException';

@injectable()
export class GetOrderService implements BaseService {
  constructor(
    @inject('OrderRepository')
    private readonly orderRepo: Repository<Order>,
  ) {}

  async handle(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'items',
        'items.inventorySource',
        'items.inventorySource.product',
        'items.inventorySource.location',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }
}
