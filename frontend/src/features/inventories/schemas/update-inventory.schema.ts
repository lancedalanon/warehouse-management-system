import { z } from 'zod';
import { InventoryActionsMap, type InventoryAction } from '@/enums/InventoryActionsMap';

const writeOffSources = Object.values(InventoryActionsMap).filter(
  (a) => a !== InventoryActionsMap.WRITE_OFF,
) as [InventoryAction, ...InventoryAction[]];

const quantity = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (val === undefined || val === '') return 0;
    return Number(val);
  })
  .refine((val) => Number.isFinite(val), 'Must be a number');

export const updateInventoryFormSchema = z
  .object({
    action: z.enum(Object.values(InventoryActionsMap)),

    locationId: z
      .union([z.number(), z.string()])
      .transform((val) => (val === '' || val == null ? null : Number(val)))
      .nullable()
      .optional(),

    storedQuantity: quantity,
    shippedQuantity: quantity,
    transferredQuantity: quantity,
    writeOffQuantity: quantity,

    writeOffFrom: z.enum(writeOffSources).optional(),

    notes: z.string().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Transfer requires location
    if (data.action === InventoryActionsMap.TRANSFER && !data.locationId) {
      ctx.addIssue({
        path: ['locationId'],
        message: 'Location is required when transferring inventory',
        code: 'custom',
      });
    }

    // Write-off rules
    if (data.action === InventoryActionsMap.WRITE_OFF) {
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

export type UpdateInventoryFormValues = z.infer<typeof updateInventoryFormSchema>;
