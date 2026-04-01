import { z } from 'zod';

export const locationSchema = z.object({
  code: z.string().nonempty('Code is required').max(255, 'Code must be at most 255 characters'),
  name: z.string().nonempty('Name is required').max(255, 'Name must be at most 255 characters'),
  type: z.string().nonempty('Type is required').max(255, 'Type must be at most 255 characters'),
  capacity: z.string().max(255, 'Capacity must be at most 255 characters').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
});

export type LocationFormValues = z.infer<typeof locationSchema>;
