import { z } from 'zod';

export const CreateAuditLogSchema = z.object({
  event: z
    .string()
    .min(1, 'Event is required')
    .max(255, 'Event cannot exceed 255 characters'),

  description: z.string().min(1, 'Description is required'),

  auditableType: z
    .string()
    .min(1, 'Auditable type is required')
    .max(255, 'Auditable type cannot exceed 255 characters'),

  auditableId: z.preprocess((val) => {
    if (typeof val === 'string') return Number(val);
    return val;
  }, z.number().int().positive('Auditable ID must be a positive integer')),

  userId: z
    .preprocess((val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string') return Number(val);
      return val;
    }, z.number().int().positive('User ID must be a positive integer').nullable())
    .optional(),

  oldValues: z.record(z.string(), z.unknown()).nullable().optional(),

  newValues: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateAuditLogDTO = z.infer<typeof CreateAuditLogSchema>;
