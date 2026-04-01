import { z } from 'zod';

export const updateProductSchema = z.object({
  sku: z.string().nonempty('SKU is required').max(255, 'SKU must be at most 255 characters'),
  name: z.string().nonempty('Name is required').max(255, 'Name must be at most 255 characters'),
  unitType: z
    .string()
    .nonempty('Unit Type is required')
    .max(255, 'Unit Type must be at most 255 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
