'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { addReceivedThunk } from '@/features/products/stores/product.slice';
import { applyServerValidationErrors } from '@/lib/form-handler';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import type { Product } from '@/features/products/types/product.types';
import { addReceivedSchema } from '../schemas/add-received.schema';
import { toast } from 'sonner';

interface Props {
  product: Product;
  onSuccess?: () => void;
  resetDialog: () => void;
}

export const AddReceivedForm: React.FC<Props> = ({ product, onSuccess, resetDialog }) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.products);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof addReceivedSchema>>({
    resolver: zodResolver(addReceivedSchema),
    defaultValues: {
      receivedQuantity: 0,
    },
  });

  const onSubmit = async (data: z.input<typeof addReceivedSchema>) => {
    const parsed = addReceivedSchema.parse(data);

    const result = await dispatch(
      addReceivedThunk({
        id: product.id,
        payload: {
          quantity: parsed.receivedQuantity,
        },
      }),
    );

    if (addReceivedThunk.fulfilled.match(result)) {
      toast.success('Product updated successfully');
      resetDialog();
      onSuccess?.();
      return;
    }

    if (addReceivedThunk.rejected.match(result) && Array.isArray(result.payload)) {
      applyServerValidationErrors(result.payload as ServerValidationError[], setError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="receivedQuantity">Received Quantity</Label>
        <Input type="number" id="receivedQuantity" {...register('receivedQuantity')} />
        {errors.receivedQuantity && (
          <p className="text-red-500">{errors.receivedQuantity.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => reset()}>
          Reset
        </Button>
        <Button type="submit" className="flex-1" disabled={status.update === 'loading'}>
          {status.update === 'loading' ? 'Updating...' : 'Add'}
        </Button>
      </div>
    </form>
  );
};
