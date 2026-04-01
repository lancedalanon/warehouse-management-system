import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string('Invalid email address'),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;
