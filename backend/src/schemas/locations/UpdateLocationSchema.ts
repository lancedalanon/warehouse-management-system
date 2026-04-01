import { z } from 'zod';

export const UpdateLocationSchema = z
  .object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    type: z.string().min(1, 'Type (aisle, bin, shelf, etc.) is required'),
    capacity: z.string().nullable().default(null),
  })
  .strict();

export type UpdateLocationDTO = z.infer<typeof UpdateLocationSchema>;
