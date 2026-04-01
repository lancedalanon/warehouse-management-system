import { z } from 'zod';

export const CreateProductSchema = z
  .object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Product name is required'),
    description: z.string().nullable().default(null),
    unitType: z.string().min(1, 'Unit type is required'),
    receivedQuantity: z
      .number()
      .int()
      .nonnegative('Received quantity cannot be negative')
      .optional()
      .default(0),
    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .nullable()
      .default(null),
  })
  .strict();

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;
