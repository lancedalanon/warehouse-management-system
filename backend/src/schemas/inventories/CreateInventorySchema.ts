import { z } from 'zod';

export const CreateInventorySchema = z
  .object({
    productId: z.number().int().positive(),
    locationId: z.number().int().positive(),
  })
  .strict();

export type CreateInventoryDTO = z.infer<typeof CreateInventorySchema>;
