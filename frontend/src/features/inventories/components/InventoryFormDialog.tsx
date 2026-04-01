'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  createInventoryThunk,
  updateInventoryThunk,
} from '@/features/inventories/stores/inventory.slice';
import { applyServerValidationErrors } from '@/lib/form-handler';
import {
  createInventoryFormSchema,
  type CreateInventoryFormValues,
} from '@/features/inventories/schemas/create-inventory.schema';
import {
  updateInventoryFormSchema,
  type UpdateInventoryFormValues,
} from '@/features/inventories/schemas/update-inventory.schema';
import type {
  Inventory,
  InventoryUpdatePayload,
} from '@/features/inventories/types/inventory.types';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { useEffect } from 'react';
import { AutosizeTextarea } from '@/components/AutosizeTextarea';
import ProductAsyncComboboxSingle from '@/features/products/components/ProductAsyncComboboxSingle';
import LocationAsyncComboboxSingle from '@/features/locations/components/LocationAsyncComboboxSingle';
import { InventoryActionsMap, type InventoryAction } from '@/enums/InventoryActionsMap';
import type z from 'zod';
import { toast } from 'sonner';

interface InventoryFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  actionType: 'create' | 'edit';
  initialData?: Inventory;
  onSuccess?: () => void;
}

type FormValues = CreateInventoryFormValues | UpdateInventoryFormValues;

export const InventoryFormDialog: React.FC<InventoryFormDialogProps> = ({
  open,
  setOpen,
  actionType,
  initialData,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.inventories);

  const currentStatus = actionType === 'edit' ? status.update : status.create;
  const buttonText = actionType === 'edit' ? 'Update' : 'Create';
  const loadingText = actionType === 'edit' ? 'Updating...' : 'Saving...';

  const formSchema =
    actionType === 'create' ? createInventoryFormSchema : updateInventoryFormSchema;

  const getDefaultValues = (): FormValues => {
    if (actionType === 'create') {
      return {
        productId: 0,
        locationId: 0,
      } as CreateInventoryFormValues;
    }

    return {
      action: InventoryActionsMap.STORE,
      locationId: 0,
      storedQuantity: 0,
      reservedQuantity: 0,
      shippedQuantity: 0,
      transferredQuantity: 0,
      writeOffQuantity: 0,
      writeOffFrom: undefined,
      notes: '',
    } as UpdateInventoryFormValues;
  };

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (!open) return;

    reset(getDefaultValues());
  }, [open, actionType, initialData]);

  const onSubmit = async (data: z.input<typeof formSchema>) => {
    if (actionType === 'create') {
      const transformedData = createInventoryFormSchema.parse(data);
      const result = await dispatch(createInventoryThunk(transformedData));

      if (createInventoryThunk.fulfilled.match(result)) {
        toast.success('Inventory created successfully!');
        setOpen(false);
        onSuccess?.();
        return;
      }

      if (createInventoryThunk.rejected.match(result) && Array.isArray(result.payload)) {
        applyServerValidationErrors(result.payload as ServerValidationError[], setError);
      }
    } else if (actionType === 'edit' && initialData) {
      const transformedData = updateInventoryFormSchema.parse(data);
      const result = await dispatch(
        updateInventoryThunk({
          id: initialData.id,
          payload: transformedData as InventoryUpdatePayload,
        }),
      );

      if (updateInventoryThunk.fulfilled.match(result)) {
        toast.success('Inventory updated successfully!');
        setOpen(false);
        onSuccess?.();
        return;
      }

      if (updateInventoryThunk.rejected.match(result) && Array.isArray(result.payload)) {
        applyServerValidationErrors(result.payload as ServerValidationError[], setError);
      }
    }
  };

  // Dynamic location visibility
  const watchedActionValue = useWatch({
    control,
    name: 'action',
  });

  const watchedAction: InventoryAction | undefined =
    actionType === 'edit' ? watchedActionValue : undefined;

  const showLocation = actionType === 'create' || watchedAction === InventoryActionsMap.TRANSFER;

  // Determine which fields to show based on action
  const showStoredQuantity = watchedAction === InventoryActionsMap.STORE;
  const showShippedQuantity = watchedAction === InventoryActionsMap.SHIP;
  const showTransferredQuantity = watchedAction === InventoryActionsMap.TRANSFER;
  const showWriteOffFields = watchedAction === InventoryActionsMap.WRITE_OFF;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{buttonText} Inventory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Product (create only) */}
          {actionType === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="productId">
                Product <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <ProductAsyncComboboxSingle
                    selectedProductId={(field.value as number) || null}
                    setSelectedProductId={field.onChange}
                    disabled={currentStatus === 'loading'}
                  />
                )}
              />
              {'productId' in errors && errors.productId && (
                <p className="text-red-500">{errors.productId.message}</p>
              )}
            </div>
          )}

          {/* Action / Status (edit only) */}
          {actionType === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="action">
                Action <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="action"
                control={control}
                render={({ field }) => (
                  <Select
                    value={(field.value as string) || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(InventoryActionsMap).map((a) => (
                        <SelectItem key={a} value={a}>
                          {a.charAt(0).toUpperCase() + a.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {'action' in errors && errors.action && (
                <p className="text-red-500">{errors.action.message}</p>
              )}
            </div>
          )}

          {/* Location */}
          {showLocation && (
            <div className="space-y-2">
              <Label htmlFor="locationId">
                Location <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <LocationAsyncComboboxSingle
                    selectedLocationId={(field.value as number) || null}
                    setSelectedLocationId={field.onChange}
                    disabled={currentStatus === 'loading'}
                  />
                )}
              />
              {'locationId' in errors && errors.locationId && (
                <p className="text-red-500">{errors.locationId.message}</p>
              )}
            </div>
          )}

          {/* Quantities (edit only) - Show based on selected action */}
          {actionType === 'edit' && (
            <>
              {/* Stored Quantity */}
              {showStoredQuantity && (
                <div className="space-y-2">
                  <Label htmlFor="storedQuantity">
                    Stored Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input type="number" {...register('storedQuantity')} />
                  {'storedQuantity' in errors && errors.storedQuantity && (
                    <p className="text-red-500">{errors.storedQuantity.message}</p>
                  )}
                </div>
              )}

              {/* Shipped Quantity */}
              {showShippedQuantity && (
                <div className="space-y-2">
                  <Label htmlFor="shippedQuantity">
                    Shipped Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input type="number" {...register('shippedQuantity')} />
                  {'shippedQuantity' in errors && errors.shippedQuantity && (
                    <p className="text-red-500">{errors.shippedQuantity.message}</p>
                  )}
                </div>
              )}

              {/* Transferred Quantity */}
              {showTransferredQuantity && (
                <div className="space-y-2">
                  <Label htmlFor="transferredQuantity">
                    Transferred Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input type="number" {...register('transferredQuantity')} />
                  {'transferredQuantity' in errors && errors.transferredQuantity && (
                    <p className="text-red-500">{errors.transferredQuantity.message}</p>
                  )}
                </div>
              )}

              {/* Write-Off Fields */}
              {showWriteOffFields && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="writeOffFrom">
                      Write-Off From <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="writeOffFrom"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={(field.value as string) || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={InventoryActionsMap.STORE}>On Hand</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {'writeOffFrom' in errors && errors.writeOffFrom && (
                      <p className="text-red-500">{errors.writeOffFrom.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="writeOffQuantity">
                      Write-Off Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input type="number" {...register('writeOffQuantity')} />
                    {'writeOffQuantity' in errors && errors.writeOffQuantity && (
                      <p className="text-red-500">{errors.writeOffQuantity.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <AutosizeTextarea
                      {...field}
                      value={(field.value as string) ?? ''}
                      placeholder="Optional notes..."
                      minHeight={100}
                      maxHeight={300}
                    />
                  )}
                />
                {'notes' in errors && errors.notes && (
                  <p className="text-red-500">{errors.notes.message}</p>
                )}
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => reset(getDefaultValues())}
            >
              Reset
            </Button>

            <Button type="submit" className="flex-1" disabled={currentStatus === 'loading'}>
              {currentStatus === 'loading' ? loadingText : buttonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
