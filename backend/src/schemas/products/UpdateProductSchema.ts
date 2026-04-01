import { z } from 'zod';

export const UpdateProductSchema = z
  .object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Product name is required'),
    description: z.string().nullable().default(null),
    unitType: z.string().min(1, 'Unit type is required'),
  })
  .strict();

export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;
