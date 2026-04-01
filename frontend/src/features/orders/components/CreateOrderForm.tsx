'use client';

import { useState, type FC } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { AutosizeTextarea } from '@/components/AutosizeTextarea';
import { OrderItemsTable } from './OrderItemsTable';

import { useForm, Controller, useFieldArray, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createOrderSchema, type CreateOrderFormValues } from '@/features/orders/schemas/create-order-schema';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { createOrderThunk } from '@/features/orders/stores/order.thunks';
import { toast } from 'sonner';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { applyServerValidationErrors } from '@/lib/form-handler';
import type { Inventory } from '@/features/inventories/types/inventory.types';

interface Props {
  onSuccess?: () => void;
  resetDialog: () => void;
}

export const CreateOrderForm: FC<Props> = ({
  onSuccess,
  resetDialog,
}) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.orders);
  const [inventoryLookup, setInventoryLookup] = useState<
    Record<number, Inventory>
  >({});

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema) as Resolver<CreateOrderFormValues>,
    defaultValues: {
      code: '',
      status: 'pending',
      recipientName: '',
      shippingAddress: '',
      contactNumber: '',
      priorityLevel: 'medium',
      expectedPickupDate: null,
      notes: '',
      items: [],
    } as DefaultValues<CreateOrderFormValues>,
  });

  const { fields, append, remove, update } = useFieldArray<
    CreateOrderFormValues,
    'items'
  >({
    control,
    name: 'items',
  });

  const onSubmit = async (data: CreateOrderFormValues) => {
    const parsed = createOrderSchema.parse(data);
    const result = await dispatch(createOrderThunk(parsed));

    if (createOrderThunk.fulfilled.match(result)) {
      toast.success('Order created successfully');
      resetDialog();
      reset();
      onSuccess?.();
      return;
    }

    if (createOrderThunk.rejected.match(result) && Array.isArray(result.payload)) {
      applyServerValidationErrors(result.payload as ServerValidationError[], setError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label>Order Code <span className="text-red-500">*</span></Label>
          <Input {...register('code')} />
          {errors.code && (
            <p className="text-red-500 text-xs">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status <span className="text-red-500">*</span></Label>
          <select
            {...register('status')}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Recipient Name <span className="text-red-500">*</span></Label>
          <Input {...register('recipientName')} />
          {errors.recipientName && (
            <p className="text-red-500 text-xs">
              {errors.recipientName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Contact Number</Label>
          <Input {...register('contactNumber')} />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Shipping Address <span className="text-red-500">*</span></Label>
          <Input {...register('shippingAddress')} />
          {errors.shippingAddress && (
            <p className="text-red-500">
              {errors.shippingAddress.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Priority Level <span className="text-red-500">*</span></Label>
          <select
            {...register('priorityLevel')}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Expected Pickup Date</Label>
          <Input type="datetime-local" {...register('expectedPickupDate')} />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Notes</Label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <AutosizeTextarea
                {...field}
                value={field.value ?? ''}
                minHeight={100}
                maxHeight={300}
              />
            )}
          />
        </div>
      </div>

      <OrderItemsTable
        items={fields}
        appendItem={append}
        removeItem={remove}
        updateItem={update}
        inventoryLookup={inventoryLookup}
        setInventoryLookup={setInventoryLookup}
        errors={errors}
      />

      {errors.items && (
        <p className="text-red-500">
          {errors.items.message as string}
        </p>
      )}

      <DialogFooter>
        <Button type="button" className="flex-1" variant="outline" onClick={() => reset()}>
          Reset
        </Button>

        <Button type="submit" className="flex-1" disabled={status.create === 'loading'}>
          {status.create === 'loading' ? 'Saving...' : 'Create Order'}
        </Button>
      </DialogFooter>
    </form>
  );
};