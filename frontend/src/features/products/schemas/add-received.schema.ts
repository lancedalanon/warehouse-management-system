import { z } from 'zod';

export const addReceivedSchema = z.object({
  receivedQuantity: z
    .union([z.number(), z.string()])
    .transform((val) => (val === undefined || val === '' ? 0 : Number(val)))
    .refine((val) => Number.isFinite(val) && val > 0, 'Quantity must be a positive number'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

export type AddReceivedFormValues = z.infer<typeof addReceivedSchema>;
