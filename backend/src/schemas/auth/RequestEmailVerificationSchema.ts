import z from 'zod';

export const RequestEmailVerificationSchema = z.object({
  email: z.email('Invalid email address'),
});

export type RequestEmailVerificationDTO = z.infer<
  typeof RequestEmailVerificationSchema
>;
