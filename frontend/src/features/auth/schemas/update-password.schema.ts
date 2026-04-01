import { z } from 'zod';

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Passwords do not match',
  });

export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
