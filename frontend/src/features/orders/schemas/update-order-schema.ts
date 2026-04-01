import { z } from 'zod';
import { OrderStatus } from '@/enums/OrderStatus';

export const updateOrderSchema = z
  .object({
    code: z.string().min(1, 'Order code is required'),

    status: z.enum(Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]]),

    recipientName: z.string().min(1, 'Recipient name is required'),

    shippingAddress: z.string().min(1, 'Shipping address is required'),

    contactNumber: z.string().optional(),

    priorityLevel: z.enum(['low', 'medium', 'high']).default('medium'),

    expectedPickupDate: z.coerce.date().optional().nullable(),

    notes: z.string().optional(),

    items: z
      .array(
        z.object({
          inventorySourceId: z.coerce.number().int().positive('Inventory source is required'),

          quantity: z.coerce.number().int().positive('Quantity must be greater than zero'),
        }),
      )
      .min(1, 'At least one order item is required'),
  })
  .strict();

export type UpdateOrderFormValues = z.infer<typeof updateOrderSchema>;
