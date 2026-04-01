import { inject, injectable } from 'tsyringe';
import { EntityManager, In } from 'typeorm';
import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { Inventory } from '@/entities/Inventory';
import { BaseService } from '@/services/BaseService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { ValidationHandler } from '@/lib/ValidationHandler';
import {
  CreateOrderDTO,
  CreateOrderSchema,
} from '@/schemas/orders/CreateOrderSchema';
import { OrderStatus } from '@/enums/OrderStatus';
import { OrderPriority } from '@/enums/OrderPriority';
import { AppDataSource } from '@/data-source';

@injectable()
export class CreateOrderService implements BaseService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(data: CreateOrderDTO, user?: JwtUserPayload): Promise<Order> {
    const parsedData = await CreateOrderSchema.parseAsync(data);

    return await AppDataSource.transaction(async (manager: EntityManager) => {
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const inventoryRepo = manager.getRepository(Inventory);

      // Check if order code is unique
      const existingOrder = await orderRepo.findOne({
        where: { code: parsedData.code },
        withDeleted: true,
      });

      if (existingOrder) {
        throw new ValidationHandler({
          field: 'code',
          message: 'Order code is already used by another order',
        });
      }

      // Load inventories for all items
      const inventoryIds = parsedData.items.map((i) => i.inventorySourceId);
      const inventories = await inventoryRepo.find({
        where: { id: In(inventoryIds) },
        relations: ['product'],
      });

      // Validate each item
      const itemsValidationErrors: { field: string; message: string }[] = [];

      parsedData.items.forEach((item, i) => {
        const inv = inventories.find(
          (inv) => inv.id.toString() === item.inventorySourceId.toString(),
        );

        if (!inv) {
          itemsValidationErrors.push({
            field: `items[${i}].inventorySourceId`,
            message: `Inventory source not found for item, please remove this`,
          });
        } else if (inv.storedQuantity < item.quantity) {
          itemsValidationErrors.push({
            field: `items[${i}].quantity`,
            message: `Insufficient stock only ${inv.storedQuantity} available.`,
          });
        }
      });

      if (itemsValidationErrors.length > 0) {
        throw new ValidationHandler(itemsValidationErrors);
      }

      // Create order
      const order = orderRepo.create({
        code: parsedData.code,
        status: OrderStatus.PENDING,
        recipientName: parsedData.recipientName,
        shippingAddress: parsedData.shippingAddress,
        contactNumber: parsedData.contactNumber ?? null,
        priorityLevel: parsedData.priorityLevel ?? OrderPriority.MEDIUM,
        expectedPickupDate: parsedData.expectedPickupDate ?? null,
        notes: parsedData.notes ?? null,
      });

      const savedOrder = await orderRepo.save(order);

      // Create order items
      const items = parsedData.items.map((item) =>
        orderItemRepo.create({
          orderId: savedOrder.id,
          inventorySourceId: item.inventorySourceId,
          quantity: item.quantity,
        }),
      );

      await orderItemRepo.save(items);

      // Reload order with items
      const fullOrder = await orderRepo.findOne({
        where: { id: savedOrder.id },
        relations: ['items'],
      });

      // Audit log
      await this.createAuditLogService.handle({
        event: 'ORDER_CREATED',
        description: `Order created with code ${savedOrder.code}`,
        auditableType: 'Order',
        auditableId: savedOrder.id,
        userId: user?.sub,
        oldValues: null,
        newValues: { ...fullOrder },
      });

      return fullOrder!;
    });
  }
}
