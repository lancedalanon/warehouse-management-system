'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AutosizeTextarea } from '@/components/AutosizeTextarea';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { createProductThunk } from '@/features/products/stores/product.slice';
import { applyServerValidationErrors } from '@/lib/form-handler';
import { createProductSchema } from '@/features/products/schemas/create-product.schema';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import type z from 'zod';
import { toast } from 'sonner';

interface Props {
  onSuccess?: () => void;
  resetDialog: () => void;
}

export const CreateProductForm: React.FC<Props> = ({ onSuccess, resetDialog }) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.products);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof createProductSchema>>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: '',
      name: '',
      unitType: '',
      receivedQuantity: 0,
      description: '',
    },
  });

  const onSubmit = async (data: z.input<typeof createProductSchema>) => {
    const parsed = createProductSchema.parse(data);
    const result = await dispatch(createProductThunk(parsed));

    if (createProductThunk.fulfilled.match(result)) {
      toast.success('Product created successfully');
      resetDialog();
      onSuccess?.();
      return;
    }

    if (createProductThunk.rejected.match(result) && Array.isArray(result.payload)) {
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
        <Label htmlFor="receivedQuantity">
          Received Quantity <span className="text-red-500">*</span>
        </Label>
        <Input type="number" {...register('receivedQuantity')} />
        {errors.receivedQuantity && (
          <p className="text-red-500">{errors.receivedQuantity.message}</p>
        )}
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
        <Button type="submit" className="flex-1" disabled={status.create === 'loading'}>
          {status.create === 'loading' ? 'Saving...' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
