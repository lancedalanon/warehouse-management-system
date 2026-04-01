import { Request, Response } from 'express';
import { ResponseHandler } from '@/lib/ResponseHandler';
import { BaseController } from './BaseController';
import { inject, injectable } from 'tsyringe';
import { GetOrdersService } from '@/services/orders/GetOrdersService';
import { GetOrderService } from '@/services/orders/GetOrderService';
import { CreateOrderService } from '@/services/orders/CreateOrderService';
import { UpdateOrderService } from '@/services/orders/UpdateOrderService';
import { DeleteOrderService } from '@/services/orders/DeleteOrderService';

@injectable()
export class OrderController extends BaseController {
  constructor(
    @inject(GetOrdersService)
    private readonly getOrdersService: GetOrdersService,

    @inject(GetOrderService)
    private readonly getOrderService: GetOrderService,

    @inject(CreateOrderService)
    private readonly createOrderService: CreateOrderService,

    @inject(UpdateOrderService)
    private readonly updateOrderService: UpdateOrderService,

    @inject(DeleteOrderService)
    private readonly deleteOrderService: DeleteOrderService,
  ) {
    super();

    this.getOrders = this.getOrders.bind(this);
    this.getOrder = this.getOrder.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.updateOrder = this.updateOrder.bind(this);
    this.deleteOrder = this.deleteOrder.bind(this);
  }

  async getOrders(req: Request, res: Response) {
    const result = await this.getOrdersService.handle(req);

    ResponseHandler.success(
      res,
      'Orders retrieved successfully',
      result.data,
      result.meta,
    );
  }

  async getOrder(req: Request, res: Response) {
    const result = await this.getOrderService.handle(Number(req.params.id));

    ResponseHandler.success(res, 'Order retrieved successfully', result);
  }

  async createOrder(req: Request, res: Response) {
    const result = await this.createOrderService.handle(req.body, req.user);

    ResponseHandler.success(
      res,
      'Order created successfully',
      result,
      null,
      201,
    );
  }

  async updateOrder(req: Request, res: Response) {
    const result = await this.updateOrderService.handle(
      Number(req.params.id),
      req.body,
      req.user,
    );

    ResponseHandler.success(res, 'Order updated successfully', result);
  }

  async deleteOrder(req: Request, res: Response) {
    await this.deleteOrderService.handle(Number(req.params.id), req.user);

    ResponseHandler.success(res, 'Order deleted successfully');
  }
}
