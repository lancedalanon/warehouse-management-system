import { Repository } from 'typeorm';
import { inject, injectable } from 'tsyringe';
import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BaseService } from '@/services/BaseService';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { JwtUserPayload } from '@/types/middlewares/express';

@injectable()
export class DeleteOrderService implements BaseService {
  constructor(
    @inject('OrderRepository')
    private readonly orderRepo: Repository<Order>,

    @inject('OrderItemRepository')
    private readonly orderItemRepo: Repository<OrderItem>,

    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(id: number, user?: JwtUserPayload): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    // Soft-delete order items first
    if (order.items && order.items.length > 0) {
      await this.orderItemRepo.softRemove(order.items);
    }

    // Soft-delete order
    await this.orderRepo.softRemove(order);

    // Audit log
    await this.createAuditLogService.handle({
      event: 'ORDER_DELETED',
      description: `Order deleted with code ${order.code}`,
      auditableType: 'Order',
      auditableId: order.id,
      userId: user?.sub,
      oldValues: { ...order },
    });

    return order;
  }
}