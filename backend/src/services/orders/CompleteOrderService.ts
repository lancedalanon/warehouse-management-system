import { inject, injectable } from 'tsyringe';
import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { BaseService } from '@/services/BaseService';
import { JwtUserPayload } from '@/types/middlewares/express';
import { ValidationHandler } from '@/lib/ValidationHandler';
import { CreateAuditLogService } from '@/services/audit-logs/CreateAuditLogService';
import { OrderStatus } from '@/enums/OrderStatus';
import { AppDataSource } from '@/data-source';
import { UpdateOrderDTO } from '@/schemas/orders/UpdateOrderSchema';
import { OrderPriority } from '@/enums/OrderPriority';
import { EntityManager, In, Not } from 'typeorm';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { Inventory } from '@/entities/Inventory';
import { InventoryStatus } from '@/enums/InventoryStatus';

@injectable()
export class CompleteOrderService implements BaseService {
  constructor(
    @inject(CreateAuditLogService)
    private readonly createAuditLogService: CreateAuditLogService,
  ) {}

  async handle(
    order: Order,
    data: UpdateOrderDTO,
    user?: JwtUserPayload,
  ): Promise<Order> {
    return await AppDataSource.transaction(async (manager: EntityManager) => {
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const inventoryRepo = manager.getRepository(Inventory);
      const inventoryMovementRepo = manager.getRepository(InventoryMovement);

      const oldValues = { ...order };

      // Validate order code uniqueness
      if (data.code && data.code !== order.code) {
        const existingOrder = await orderRepo.findOne({
          where: {
            code: data.code,
            id: Not(order.id), // exclude current order
          },
          withDeleted: true, // include soft-deleted orders
        });

        if (existingOrder) {
          throw new ValidationHandler({
            field: 'code',
            message: 'Order code is already used by another order',
          });
        }
      }

      // Load inventories for all incoming items
      const inventoryIds = data.items.map((i) => i.inventorySourceId);
      const inventories = await inventoryRepo.find({
        where: { id: In(inventoryIds) },
        relations: ['product'],
      });

      // Validate each incoming item against inventory stock
      const itemsValidationErrors: { field: string; message: string }[] = [];

      data.items.forEach((item, i) => {
        const inv = inventories.find(
          (inv) => inv.id.toString() === item.inventorySourceId.toString(),
        );

        if (!inv) {
          itemsValidationErrors.push({
            field: `items[${i}].quantity`,
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

      // Fetch all existing items including soft-deleted
      const existingItems = await orderItemRepo.find({
        where: { orderId: order.id },
        withDeleted: true,
      });

      // If existing items is still in data items we keep it otherwise we soft delete them
      const incomingIds = data.items.map((item) =>
        item.inventorySourceId.toString(),
      );

      const itemsToKeep = existingItems.filter((item) =>
        incomingIds.includes(item.inventorySourceId.toString()),
      );

      const itemsToSoftDelete = existingItems.filter(
        (item) => !incomingIds.includes(item.inventorySourceId.toString()),
      );

      // Batch soft delete items
      if (itemsToSoftDelete.length > 0) {
        const idsToSoftDelete = itemsToSoftDelete.map((item) => item.id);
        await orderItemRepo.softDelete(idsToSoftDelete);
      }

      // Restore soft deleted items and upsert
      const softDeletedToRestore = itemsToKeep
        .filter((item) => item.deletedAt) // only soft-deleted
        .map((item) => item.id);

      if (softDeletedToRestore.length > 0) {
        await orderItemRepo.restore(softDeletedToRestore);
      }

      // Reduce quantity of each item from inventory
      const movements: InventoryMovement[] = [];

      for (const item of data.items) {
        const inv = inventories.find(
          (inv) => inv.id.toString() === item.inventorySourceId.toString(),
        );
        if (!inv) continue;

        // Deduct stock
        inv.storedQuantity -= item.quantity;

        // Create movement record
        movements.push(
          inventoryMovementRepo.create({
            inventoryId: inv.id,
            fromLocationId: inv.locationId,
            toLocationId: null, // leaving inventory
            quantity: item.quantity,
            notes: `Order ${order.code} completed`,
            fromState: InventoryStatus.STORED,
            toState: InventoryStatus.SHIPPED,
          }),
        );
      }

      // Save all at once
      await inventoryRepo.save(inventories);
      await inventoryMovementRepo.save(movements);

      // Upsert new or existing items
      const itemsToUpsert = data.items.map((item) => ({
        orderId: order.id,
        inventorySourceId: item.inventorySourceId,
        quantity: item.quantity,
      }));

      await orderItemRepo.upsert(itemsToUpsert, {
        conflictPaths: ['orderId', 'inventorySourceId'],
        skipUpdateIfNoValuesChanged: true,
      });

      // Update order fields
      order.code = data.code;
      order.status = OrderStatus.COMPLETED;
      order.recipientName = data.recipientName;
      order.shippingAddress = data.shippingAddress;
      order.contactNumber = data.contactNumber ?? null;
      order.priorityLevel = data.priorityLevel ?? OrderPriority.MEDIUM;
      order.expectedPickupDate = data.expectedPickupDate ?? null;
      order.notes = data.notes ?? null;

      const savedOrder = await orderRepo.save(order);

      // Create audit log
      await this.createAuditLogService.handle({
        event: 'ORDER_STATUS_UPDATED',
        description: `Order ${order.code} marked as COMPLETED`,
        auditableType: 'Order',
        auditableId: order.id,
        userId: user?.sub,
        oldValues,
        newValues: { ...savedOrder },
      });

      return savedOrder;
    });
  }
}
