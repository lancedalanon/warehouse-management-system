'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User as UserIcon } from 'lucide-react';
import { useAppDispatch } from '@/stores/hooks';
import { updateAccountInfoThunk } from '@/features/auth/stores/auth.thunks';
import { updateAccountSchema } from '@/features/auth/schemas/update-account-info.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import type { User as UserType } from '@/features/users/types/user.types';
import * as z from 'zod';

type Props = {
  user: UserType;
};

export const AccountSection = ({ user }: Props) => {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof updateAccountSchema>>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      firstName: user.firstName ?? '',
      middleName: user.middleName ?? '',
      lastName: user.lastName ?? '',
      suffix: user.suffix ?? '',
    },
  });

  // Reset form when entering or leaving edit mode
  useEffect(() => {
    reset({
      firstName: user.firstName ?? '',
      middleName: user.middleName ?? '',
      lastName: user.lastName ?? '',
      suffix: user.suffix ?? '',
    });
  }, [editing, user, reset]);

  const onSubmit: SubmitHandler<z.input<typeof updateAccountSchema>> = async (data) => {
    try {
      await dispatch(updateAccountInfoThunk(data)).unwrap();
      reset(data);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update account info', err);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
          <UserIcon className="h-5 w-5" /> Account Information
        </h2>
        <p className="text-muted-foreground text-sm">
          Update your full legal name as it should appear on records.
        </p>
      </div>

      <div className="md:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-6 pt-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
            >
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name {editing && <span className="text-red-500">*</span>}
                </Label>
                {editing ? (
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="firstName"
                        placeholder="First Name"
                        disabled={!editing}
                      />
                    )}
                  />
                ) : (
                  <p className="text-slate-900">{user.firstName || '-'}</p>
                )}
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              {/* Middle Name */}
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                {editing ? (
                  <Controller
                    name="middleName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="middleName"
                        placeholder="Middle Name"
                        disabled={!editing}
                      />
                    )}
                  />
                ) : (
                  <p className="text-slate-900">{user.middleName || '-'}</p>
                )}
                {errors.middleName && (
                  <p className="text-xs text-red-500">{errors.middleName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name {editing && <span className="text-red-500">*</span>}
                </Label>
                {editing ? (
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} id="lastName" placeholder="Last Name" disabled={!editing} />
                    )}
                  />
                ) : (
                  <p className="text-slate-900">{user.lastName || '-'}</p>
                )}
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>

              {/* Suffix */}
              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                {editing ? (
                  <Controller
                    name="suffix"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="suffix"
                        placeholder="Jr., Sr., III, etc."
                        disabled={!editing}
                      />
                    )}
                  />
                ) : (
                  <p className="text-slate-900">{user.suffix || '-'}</p>
                )}
                {errors.suffix && <p className="text-xs text-red-500">{errors.suffix.message}</p>}
              </div>

              {/* Buttons */}
              <div className="flex justify-end border-t pt-4 sm:col-span-2">
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        reset();
                        setEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
