'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  createLocationThunk,
  updateLocationThunk,
} from '@/features/locations/stores/location.slice';
import { applyServerValidationErrors } from '@/lib/form-handler';
import {
  locationSchema,
  type LocationFormValues,
} from '@/features/locations/schemas/location.schema';
import type { Location } from '@/features/locations/types/location.types';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface LocationFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  actionType: 'create' | 'edit';
  initialData?: Location;
  onSuccess?: () => void;
}

export const LocationFormDialog: React.FC<LocationFormDialogProps> = ({
  open,
  setOpen,
  actionType,
  initialData,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.locations);

  const currentStatus = actionType === 'edit' ? status.update : status.create;
  const buttonText = actionType === 'edit' ? 'Update' : 'Create';
  const loadingText = actionType === 'edit' ? 'Updating...' : 'Saving...';

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          type: initialData.type,
          capacity: initialData.capacity ?? '',
        }
      : {
          code: '',
          name: '',
          type: '',
          capacity: '',
        },
  });

  useEffect(() => {
    if (!open) return;

    if (actionType === 'edit' && initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        type: initialData.type,
        capacity: initialData.capacity ?? '',
      });
    } else {
      reset({
        code: '',
        name: '',
        type: '',
        capacity: '',
      });
    }
  }, [open, actionType, initialData, reset]);

  const onSubmit = async (data: LocationFormValues) => {
    const resultAction =
      actionType === 'edit' && initialData
        ? await dispatch(updateLocationThunk({ id: initialData.id, payload: data }))
        : await dispatch(createLocationThunk(data));

    const isFulfilled =
      actionType === 'edit'
        ? updateLocationThunk.fulfilled.match(resultAction)
        : createLocationThunk.fulfilled.match(resultAction);

    if (isFulfilled && actionType === 'edit') {
      toast.success('Location updated successfully');
      setOpen(false);
      onSuccess?.();
      return;
    } else if (isFulfilled && actionType === 'create') {
      toast.success('Location created successfully');
      setOpen(false);
      onSuccess?.();
      return;
    }

    const isRejected =
      actionType === 'edit'
        ? updateLocationThunk.rejected.match(resultAction)
        : createLocationThunk.rejected.match(resultAction);

    if (isRejected && Array.isArray(resultAction.payload)) {
      applyServerValidationErrors(resultAction.payload as ServerValidationError[], setError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{buttonText} Location</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-red-500">*</span>
            </Label>
            <Input id="code" {...register('code')} />
            {errors.code && <p className="text-red-500">{errors.code.message}</p>}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-red-500">*</span>
            </Label>
            <Input id="type" {...register('type')} />
            {errors.type && <p className="text-red-500">{errors.type.message}</p>}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" {...register('capacity')} />
            {errors.capacity && <p className="text-red-500">{errors.capacity.message}</p>}
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() =>
                reset(
                  initialData
                    ? {
                        code: initialData.code,
                        name: initialData.name,
                        type: initialData.type,
                        capacity: initialData.capacity ?? '',
                      }
                    : {
                        code: '',
                        name: '',
                        type: '',
                        capacity: '',
                      },
                )
              }
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
