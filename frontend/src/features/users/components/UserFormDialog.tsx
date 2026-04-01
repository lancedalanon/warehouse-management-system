'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppSelector } from '@/stores/hooks';
import { createUserThunk, updateUserThunk } from '@/features/users/stores/user.slice';
import { applyServerValidationErrors } from '@/lib/form-handler';
import type { User } from '@/features/users/types/user.types';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { useEffect } from 'react';
import { userSchema } from '../schemas/user.schema';
import type { InvitationRequest } from '@/features/invitation-requests/types/invitation-request.types';
import RoleAsyncComboboxSingle from '@/features/roles/components/RoleAsyncComboboxSingle';
import type { RootState, AppDispatch } from '@/stores';
import { useDispatch, useSelector } from 'react-redux';
import type z from 'zod';

interface UserFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  actionType: 'create' | 'edit';
  initialData?: User;
  selectedInvitee?: InvitationRequest | null;
  onSuccess?: () => void;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  setOpen,
  actionType,
  initialData,
  selectedInvitee,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { status } = useAppSelector((state) => state.users);
  const { requestInvitationStatus } = useSelector((state: RootState) => state.auth);

  const currentStatus = actionType === 'edit' ? status.update : status.create;
  const buttonText = actionType === 'edit' ? 'Update' : 'Create';
  const loadingText = actionType === 'edit' ? 'Updating...' : 'Saving...';

  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: initialData?.firstName ?? '',
      middleName: initialData?.middleName ?? '',
      lastName: initialData?.lastName ?? '',
      suffix: initialData?.suffix ?? '',
      email: selectedInvitee?.email ?? initialData?.email ?? '',
      token: selectedInvitee?.token ?? '',
      roleId: initialData?.roles?.[0]?.id ?? undefined,
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      firstName: initialData?.firstName ?? '',
      middleName: initialData?.middleName ?? '',
      lastName: initialData?.lastName ?? '',
      suffix: initialData?.suffix ?? '',
      email: selectedInvitee?.email ?? initialData?.email ?? '',
      token: selectedInvitee?.token ?? '',
      roleId: initialData?.roles?.[0]?.id ?? undefined,
    });
  }, [open, initialData, selectedInvitee, reset]);

  const onSubmit: SubmitHandler<z.input<typeof userSchema>> = async (data) => {
    const transformedData = data as z.infer<typeof userSchema>;

    if (actionType === 'create') {
      const result = await dispatch(createUserThunk(transformedData));
      if (createUserThunk.fulfilled.match(result)) {
        setOpen(false);
        onSuccess?.();
        return;
      }
      if (createUserThunk.rejected.match(result) && Array.isArray(result.payload)) {
        applyServerValidationErrors(result.payload as ServerValidationError[], setError);
      }
    } else if (initialData) {
      const result = await dispatch(
        updateUserThunk({ id: initialData.id, payload: transformedData }),
      );
      if (updateUserThunk.fulfilled.match(result)) {
        setOpen(false);
        onSuccess?.();
        return;
      }
      if (updateUserThunk.rejected.match(result) && Array.isArray(result.payload)) {
        applyServerValidationErrors(result.payload as ServerValidationError[], setError);
      }
    }
  };

  const handleReset = () => reset();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{buttonText} User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{String(errors.firstName.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input id="middleName" {...register('middleName')} />
              {errors.middleName && (
                <p className="mt-1 text-sm text-red-500">{String(errors.middleName.message)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{String(errors.lastName.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input id="suffix" {...register('suffix')} />
              {errors.suffix && (
                <p className="mt-1 text-sm text-red-500">{String(errors.suffix.message)}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              value={selectedInvitee?.email ?? undefined}
              disabled={!!selectedInvitee}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{String(errors.email.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleId">
              Role <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <RoleAsyncComboboxSingle
                  selectedRoleId={field.value ?? null}
                  setSelectedRoleId={field.onChange}
                  disabled={requestInvitationStatus === 'loading'}
                />
              )}
            />
            {errors.roleId && <p className="mt-1 text-sm text-red-500">{errors.roleId.message}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleReset}>
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
