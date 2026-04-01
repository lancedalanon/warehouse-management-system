import { z } from 'zod';

export const CreateLocationSchema = z
  .object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    type: z.string().min(1, 'Type (aisle, bin, shelf) is required'),
    capacity: z.string().nullable().default(null),
  })
  .strict();

export type CreateLocationDTO = z.infer<typeof CreateLocationSchema>;
