import { z } from 'zod';
import { OrderStatus } from '@/enums/OrderStatus';
import { OrderPriority } from '@/enums/OrderPriority';

export const CreateOrderSchema = z
  .object({
    code: z.string().min(1, 'Order code is required'),

    status: z
      .enum(Object.values(OrderStatus) as [string, ...string[]])
      .default(OrderStatus.PENDING)
      .refine(
        (val) =>
          !val || Object.values(OrderStatus).includes(val as OrderStatus),
        {
          message: `Invalid status. Allowed statuses: ${Object.values(
            OrderStatus,
          ).join(', ')}`,
        },
      ),

    recipientName: z.string().min(1, 'Recipient name is required'),
    shippingAddress: z.string().min(1, 'Shipping address is required'),
    contactNumber: z.string().nullable().default(null),
    priorityLevel: z
      .enum(Object.values(OrderPriority) as [string, ...string[]])
      .default(OrderPriority.MEDIUM)
      .refine(
        (val) =>
          !val || Object.values(OrderPriority).includes(val as OrderPriority),
        {
          message: `Invalid priority level. Allowed priority levels: ${Object.values(
            OrderPriority,
          ).join(', ')}`,
        },
      ),

    expectedPickupDate: z.preprocess(
      (val) => (val ? new Date(val as string) : undefined),
      z.date().nullable().default(null),
    ),
    notes: z.string().nullable().default(null),

    items: z
      .array(
        z
          .object({
            inventorySourceId: z
              .number()
              .int('Inventory source must be an integer'),

            quantity: z
              .number()
              .int('Quantity must be an integer')
              .positive('Quantity must be greater than zero'),
          })
          .strict(),
      )
      .min(1, 'At least one order item is required'),
  })
  .strict();

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;
