import { z } from 'zod';

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().nullable().default(null),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().nullable().default(null),
  email: z.email('Invalid email address'),
  roleId: z.number().int().positive('Role is required'),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
