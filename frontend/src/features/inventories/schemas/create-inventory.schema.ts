import { z } from 'zod';

export const createInventoryFormSchema = z.object({
  productId: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, 'Product is required'),

  locationId: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, 'Location is required'),
});

export type CreateInventoryFormValues = z.infer<typeof createInventoryFormSchema>;
