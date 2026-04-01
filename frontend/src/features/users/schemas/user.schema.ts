import { z } from 'zod';

export const userSchema = z.object({
  firstName: z.string().min(1, 'Please enter your first name').max(255, 'First name is too long'),

  middleName: z.string().max(255, 'Middle name is too long').optional().or(z.literal('')),

  lastName: z.string().min(1, 'Please enter your last name').max(255, 'Last name is too long'),

  suffix: z.string().max(50, 'Suffix is too long').optional().or(z.literal('')),

  email: z
    .string()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address (e.g., name@example.com)')
    .max(255),

  token: z.string().optional(),

  roleId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined || val === '') return 0;
      return Number(val);
    })
    .refine((val) => val > 0, {
      message: 'Please select a role',
    }),
});

export type UserFormValues = z.infer<typeof userSchema>;
