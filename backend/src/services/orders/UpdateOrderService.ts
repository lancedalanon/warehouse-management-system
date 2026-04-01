import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { Order } from '@/entities/Order';
import { BaseService } from '@/services/BaseService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { NotFoundException } from '@/exceptions/NotFoundException';
import { BadRequestException } from '@/exceptions/BadRequestException';
import { OrderStatus } from '@/enums/OrderStatus';
import { PendingOrderService } from '@/services/orders/PendingOrderService';
import { ConfirmOrderService } from '@/services/orders/ConfirmOrderService';
import { CompleteOrderService } from '@/services/orders/CompleteOrderService';
import { CancelOrderService } from '@/services/orders/CancelOrderService';
import {
  UpdateOrderDTO,
  UpdateOrderSchema,
} from '@/schemas/orders/UpdateOrderSchema';

@injectable()
export class UpdateOrderService implements BaseService {
  constructor(
    @inject(PendingOrderService)
    private readonly pendingOrderService: PendingOrderService,

    @inject(ConfirmOrderService)
    private readonly confirmOrderService: ConfirmOrderService,

    @inject(CompleteOrderService)
    private readonly completeOrderService: CompleteOrderService,

    @inject(CancelOrderService)
    private readonly cancelOrderService: CancelOrderService,

    @inject('OrderRepository')
    private readonly orderRepo: Repository<Order>,
  ) {}

  async handle(
    id: number,
    data: UpdateOrderDTO,
    user?: JwtUserPayload,
  ): Promise<Order> {
    const parsedData = await UpdateOrderSchema.parseAsync(data);

    const order = await this.orderRepo.findOne({
      where: { id },
    });

    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    switch (data.status) {
      case OrderStatus.PENDING:
        return this.pendingOrderService.handle(order, parsedData, user);

      case OrderStatus.CONFIRMED:
        return this.confirmOrderService.handle(order, parsedData, user);

      case OrderStatus.CANCELLED:
        return this.cancelOrderService.handle(order, parsedData, user);

      case OrderStatus.COMPLETED:
        return this.completeOrderService.handle(order, parsedData, user);

      default:
        throw new BadRequestException('Invalid inventory action');
    }
  }
}
