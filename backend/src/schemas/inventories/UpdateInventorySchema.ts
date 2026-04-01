import { InventoryAction } from '@/enums/InventoryAction';
import z from 'zod';

const writeOffSources = Object.values(InventoryAction).filter(
  (a) => a !== InventoryAction.WRITE_OFF,
) as [InventoryAction, ...InventoryAction[]];

export const UpdateInventorySchema = () =>
  z
    .object({
      action: z.enum(Object.values(InventoryAction)),

      locationId: z
        .number()
        .int()
        .positive('Location is required')
        .nullable()
        .default(null),

      storedQuantity: z
        .number()
        .int()
        .nonnegative('Stored quantity cannot be negative')
        .default(0),

      reservedQuantity: z
        .number()
        .int()
        .nonnegative('Reserved quantity cannot be negative')
        .default(0),

      shippedQuantity: z
        .number()
        .int()
        .nonnegative('Shipped quantity cannot be negative')
        .default(0),

      transferredQuantity: z
        .number()
        .int()
        .nonnegative('Transferred quantity cannot be negative')
        .default(0),

      writeOffQuantity: z
        .number()
        .int()
        .nonnegative('Write-off quantity cannot be negative')
        .default(0),

      writeOffFrom: z.enum(writeOffSources).optional(),

      notes: z
        .string()
        .max(500, 'Notes cannot exceed 500 characters')
        .nullable()
        .default(null),
    })
    .superRefine((data, ctx) => {
      if (data.action === InventoryAction.WRITE_OFF) {
        if (!data.writeOffFrom) {
          ctx.addIssue({
            path: ['writeOffFrom'],
            message: 'writeOffFrom is required when action is Write-Off',
            code: 'custom',
          });
        }

        if (!data.writeOffQuantity || data.writeOffQuantity <= 0) {
          ctx.addIssue({
            path: ['writeOffQuantity'],
            message: 'writeOffQuantity must be greater than 0 for Write-Off',
            code: 'custom',
          });
        }
      }
    });

export type UpdateInventoryDTO = z.infer<
  ReturnType<typeof UpdateInventorySchema>
>;
