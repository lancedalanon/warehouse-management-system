import { z } from 'zod';

export const AddReceivedQuantitySchema = z.object({
  quantity: z.number().int().positive(),
  notes: z.string().min(1).max(255).optional(),
});

export type AddReceivedQuantityDTO = z.infer<typeof AddReceivedQuantitySchema>;
