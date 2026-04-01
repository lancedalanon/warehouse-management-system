'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AutosizeTextarea } from '@/components/AutosizeTextarea';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { updateProductThunk } from '@/features/products/stores/product.slice';
import { applyServerValidationErrors } from '@/lib/form-handler';
import {
  updateProductSchema,
  type UpdateProductFormValues,
} from '@/features/products/schemas/update-product.schema';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import type { Product } from '@/features/products/types/product.types';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
  initialData: Product;
  onSuccess?: () => void;
  resetDialog: () => void;
}

export const UpdateProductForm: React.FC<Props> = ({ initialData, onSuccess, resetDialog }) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.products);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      sku: initialData.sku,
      name: initialData.name,
      unitType: initialData.unitType,
      description: initialData.description ?? '',
    },
  });

  useEffect(() => {
    reset({
      sku: initialData.sku,
      name: initialData.name,
      unitType: initialData.unitType,
      description: initialData.description ?? '',
    });
  }, [initialData, reset]);

  const onSubmit = async (data: UpdateProductFormValues) => {
    const parsed = updateProductSchema.parse(data);
    const result = await dispatch(updateProductThunk({ id: initialData.id, payload: parsed }));

    if (updateProductThunk.fulfilled.match(result)) {
      toast.success('Product updated successfully');
      resetDialog();
      onSuccess?.();
      return;
    }

    if (updateProductThunk.rejected.match(result) && Array.isArray(result.payload)) {
      applyServerValidationErrors(result.payload as ServerValidationError[], setError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="sku">
          SKU <span className="text-red-500">*</span>
        </Label>
        <Input id="sku" {...register('sku')} />
        {errors.sku && <p className="text-red-500">{errors.sku.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitType">
          Unit Type <span className="text-red-500">*</span>
        </Label>
        <Input id="unitType" {...register('unitType')} />
        {errors.unitType && <p className="text-red-500">{errors.unitType.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <AutosizeTextarea
              {...field}
              value={field.value ?? ''}
              placeholder="Optional description..."
              minHeight={140}
              maxHeight={400}
            />
          )}
        />
        {errors.description && <p className="text-red-500">{errors.description.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => reset()}>
          Reset
        </Button>
        <Button type="submit" className="flex-1" disabled={status.update === 'loading'}>
          {status.update === 'loading' ? 'Updating...' : 'Update'}
        </Button>
      </div>
    </form>
  );
};
