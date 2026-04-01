import { z } from 'zod';

export const requestInvitationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional().nullable(),
  email: z.email('Please enter a valid email address'),
  roleId: z
    .union([z.number(), z.string(), z.null()])
    .transform((val) => (val === null ? 0 : Number(val)))
    .refine((val) => val > 0, 'Role is required'),
});

export type RequestInvitationFormValues = z.infer<typeof requestInvitationSchema>;
