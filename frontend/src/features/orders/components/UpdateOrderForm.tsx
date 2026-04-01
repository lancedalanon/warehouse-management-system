'use client';

import { type FC, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { AutosizeTextarea } from '@/components/AutosizeTextarea';
import { OrderItemsTable } from './OrderItemsTable';

import {
  useForm,
  Controller,
  useFieldArray,
  type Resolver,
  type DefaultValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  updateOrderSchema,
  type UpdateOrderFormValues,
} from '@/features/orders/schemas/update-order-schema';

import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getOrderThunk, updateOrderThunk } from '@/features/orders/stores/order.thunks';
import { toast } from 'sonner';

import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { applyServerValidationErrors } from '@/lib/form-handler';
import type { Order } from '@/features/orders/types/order.types';
import type { Inventory } from '@/features/inventories/types/inventory.types';

interface Props {
  order: Order;
  onSuccess?: () => void;
  resetDialog: () => void;
}

export const UpdateOrderForm: FC<Props> = ({
  order,
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
    reset,
    formState: { errors },
  } = useForm<UpdateOrderFormValues>({
    resolver: zodResolver(updateOrderSchema) as Resolver<UpdateOrderFormValues>,
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
    } as DefaultValues<UpdateOrderFormValues>,
  });

  const { fields, append, remove, update } = useFieldArray<
    UpdateOrderFormValues,
    'items'
  >({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (!order?.id) return;

    const fetchOrder = async () => {
      const result = await dispatch(getOrderThunk(order.id));

      if (getOrderThunk.fulfilled.match(result)) {
        const fullOrder = result.payload;

        reset({
          code: fullOrder.code,
          status: fullOrder.status,
          recipientName: fullOrder.recipientName,
          shippingAddress: fullOrder.shippingAddress,
          contactNumber: fullOrder.contactNumber ?? '',
          priorityLevel: fullOrder.priorityLevel,
          expectedPickupDate: fullOrder.expectedPickupDate
            ? new Date(fullOrder.expectedPickupDate)
            : null,
          notes: fullOrder.notes ?? '',
          items:
            fullOrder.items?.map((item) => ({
              inventorySourceId: Number(item.inventorySourceId),
              quantity: item.quantity,
            })) ?? [],
        });

        const inventoryMapped: Record<number, Inventory> = {};

        fullOrder.items?.forEach((item) => {
          if (item.inventorySource) {
            inventoryMapped[item.inventorySource.id] = item.inventorySource;
          }
        });

        setInventoryLookup(inventoryMapped);
      }
    };

    fetchOrder();
  }, [order?.id, dispatch, reset]);

  const onSubmit = async (data: UpdateOrderFormValues) => {
    const parsed = updateOrderSchema.parse(data);

    const result = await dispatch(
      updateOrderThunk({
        id: order.id,
        payload: parsed,
      }),
    );

    if (updateOrderThunk.fulfilled.match(result)) {
      toast.success('Order updated successfully');
      resetDialog();
      onSuccess?.();
      return;
    }

    if (
      updateOrderThunk.rejected.match(result) &&
      Array.isArray(result.payload)
    ) {
      applyServerValidationErrors(
        result.payload as ServerValidationError[],
        setError,
      );
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
            <p className="text-red-500 text-xs">
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
        <p className="text-red-500 text-sm">
          {errors.items.message as string}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          className="flex-1"
          variant="outline"
          onClick={() => reset()}
        >
          Reset
        </Button>

        <Button
          type="submit"
          className="flex-1"
          disabled={status.update === 'loading'}
        >
          {status.update === 'loading' ? 'Updating...' : 'Update Order'}
        </Button>
      </DialogFooter>
    </form>
  );
};