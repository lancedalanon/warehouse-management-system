'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, ShieldCheck, CheckCircle2, Send } from 'lucide-react';
import { useAppDispatch } from '@/stores/hooks';
import { changeEmailThunk } from '@/features/auth/stores/auth.thunks';
import { requestEmailVerificationThunk } from '@/features/auth/stores/auth.thunks';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@/features/users/types/user.types';

const changeEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  currentPassword: z.string().min(6, 'Current password is required'),
});

type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

type Props = {
  user: User;
};

export const EmailSection = ({ user }: Props) => {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [emailVerified, setEmailVerified] = useState(Boolean(user.emailVerifiedAt));

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      email: user.email ?? '',
      currentPassword: '',
    },
  });

  // Reset form when entering or leaving edit mode
  const resetForm = () => {
    if (editing) {
      reset({ email: user.email ?? '', currentPassword: '' });
    } else {
      reset({ email: '', currentPassword: '' });
    }
  };

  const onSubmit: SubmitHandler<ChangeEmailInput> = async (data) => {
    try {
      await dispatch(changeEmailThunk(data)).unwrap();
      reset({ email: data.email, currentPassword: '' });
      setEditing(false);
      setEmailVerified(false); // mark as unverified after changing email
    } catch (err) {
      console.error('Failed to change email', err);
    }
  };

  const requestVerification = async () => {
    if (!user.email) return;
    setSendingVerification(true);
    try {
      await dispatch(requestEmailVerificationThunk({ email: user.email })).unwrap();
      alert('Verification email sent!');
    } catch (err) {
      console.error('Failed to request verification', err);
      alert('Failed to send verification email.');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
          <Mail className="h-5 w-5" /> Email Address
        </h2>
        <p className="text-muted-foreground text-sm">
          Changes here require your current password for security.
        </p>
      </div>

      <div className="md:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {editing ? (
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        placeholder="Enter new email"
                        className="max-w-md"
                      />
                    )}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900">{user.email || '-'}</p>
                    {emailVerified ? (
                      <div className="flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Verified
                      </div>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={requestVerification}
                        disabled={sendingVerification}
                        className="border-amber-200 text-amber-600 hover:bg-amber-50"
                      >
                        <Send className="mr-1 h-3.5 w-3.5" /> Verify Email
                      </Button>
                    )}
                  </div>
                )}
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Current Password */}
              {editing && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Label
                    htmlFor="currentPassword"
                    className="flex items-center gap-2 text-slate-700"
                  >
                    <ShieldCheck className="h-4 w-4 text-amber-600" /> Re-authenticate
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Please enter your current password to authorize this change.
                  </p>
                  <Controller
                    name="currentPassword"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="currentPassword"
                        type="password"
                        placeholder="Current password"
                        className="max-w-md"
                      />
                    )}
                  />
                  {errors.currentPassword && (
                    <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end pt-2">
                {!editing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(true);
                      resetForm();
                    }}
                  >
                    Change Email
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        resetForm();
                        setEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      Update Email
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
