import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().nonempty('SKU is required').max(255, 'SKU must be at most 255 characters'),
  name: z.string().nonempty('Name is required').max(255, 'Name must be at most 255 characters'),
  unitType: z
    .string()
    .nonempty('Unit Type is required')
    .max(255, 'Unit Type must be at most 255 characters'),
  receivedQuantity: z
    .union([z.number(), z.string()])
    .transform((val) => (val === undefined || val === '' ? 0 : Number(val)))
    .refine((val) => Number.isFinite(val), 'Must be a number'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
