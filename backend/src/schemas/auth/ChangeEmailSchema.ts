import * as z from 'zod';

export const ChangeEmailSchema = z.object({
  email: z.email('Invalid email address'),
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ChangeEmailDTO = z.infer<typeof ChangeEmailSchema>;
