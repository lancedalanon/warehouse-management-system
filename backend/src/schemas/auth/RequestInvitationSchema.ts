import { z } from 'zod';

export const RequestInvitationSchema = z.object({
  email: z.string('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required'),
  suffix: z.string().optional().nullable(),
  roleId: z.number().int().positive('Role is required'),
});

export type RequestInvitationDTO = z.infer<typeof RequestInvitationSchema>;
