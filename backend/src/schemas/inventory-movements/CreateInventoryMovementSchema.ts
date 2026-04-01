import { InventoryStatuses } from '@/enums/InventoryStatus';
import { z } from 'zod';

export const CreateInventoryMovementSchema = z
  .object({
    productId: z
      .number()
      .int()
      .positive('Product is required')
      .nullable()
      .default(null),
    inventoryId: z
      .number()
      .int()
      .positive('Inventory is required')
      .nullable()
      .default(null),
    fromLocationId: z
      .number()
      .int()
      .positive('From location is required')
      .nullable()
      .default(null),
    toLocationId: z
      .number()
      .int()
      .positive('To location must be a positive integer')
      .nullable()
      .default(null),
    quantity: z
      .number()
      .int()
      .nonnegative('Quantity cannot be negative')
      .default(0),
    fromState: z
      .enum(InventoryStatuses)
      .refine((val) => InventoryStatuses.includes(val), {
        message: `Invalid status. Allowed statuses: ${InventoryStatuses.join(', ')}`,
      }),
    toState: z
      .enum(InventoryStatuses)
      .refine((val) => InventoryStatuses.includes(val), {
        message: `Invalid status. Allowed statuses: ${InventoryStatuses.join(', ')}`,
      }),
    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .nullable()
      .default(null),
  })
  .strict();

export type CreateInventoryMovementDTO = z.infer<
  typeof CreateInventoryMovementSchema
>;
