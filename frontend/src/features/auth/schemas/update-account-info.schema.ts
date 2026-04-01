import * as z from 'zod';

export const updateAccountSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(255, 'First name is too long'),
  middleName: z.string().max(255, 'Middle name is too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(255, 'Last name is too long'),
  suffix: z.string().max(10, 'Suffix is too long').optional(),
});

export type UpdateAccountSchemaType = z.infer<typeof updateAccountSchema>;
