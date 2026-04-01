'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useAppDispatch } from '@/stores/hooks';
import { updatePasswordThunk } from '@/features/auth/stores/auth.thunks';
import { updatePasswordSchema } from '@/features/auth/schemas/update-password.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';

export const PasswordSection = () => {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: z.input<typeof updatePasswordSchema>) => {
    try {
      await dispatch(updatePasswordThunk(data)).unwrap();
      reset();
      setEditing(false);
    } catch (err) {
      console.error('Password update failed', err);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
          <Lock className="h-5 w-5" /> Security
        </h2>
        <p className="text-muted-foreground text-sm">
          Regularly updating your password helps keep your account safe.
        </p>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardContent className="space-y-6 pt-6">
            {!editing ? (
              <div className="text-sm text-slate-500 italic">
                Password is protected. Click update to change it.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Controller
                    name="currentPassword"
                    control={control}
                    render={({ field }) => <Input {...field} type="password" />}
                  />
                  {errors.currentPassword && (
                    <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Controller
                    name="newPassword"
                    control={control}
                    render={({ field }) => <Input {...field} type="password" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Controller
                    name="confirmNewPassword"
                    control={control}
                    render={({ field }) => <Input {...field} type="password" />}
                  />
                  {errors.confirmNewPassword && (
                    <p className="text-xs text-red-500">{errors.confirmNewPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
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
                  <Button size="sm" type="submit" disabled={isSubmitting}>
                    Save Password
                  </Button>
                </div>
              </form>
            )}

            {!editing && (
              <div className="flex justify-end border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Update Password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
