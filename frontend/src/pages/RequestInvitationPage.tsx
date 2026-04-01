import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { applyServerValidationErrors } from '@/lib/form-handler';
import { requestInvitationThunk } from '@/features/auth/stores/auth.thunks';
import { requestInvitationSchema } from '@/features/auth/schemas/request-invitation.schema';
import type { FC } from 'react';
import type { RootState, AppDispatch } from '@/stores';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { CheckCircle2 } from 'lucide-react';
import RoleAsyncComboboxSingle from '@/features/roles/components/RoleAsyncComboboxSingle';
import { z } from 'zod';

export const RequestInvitationPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { requestInvitationStatus } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<z.input<typeof requestInvitationSchema>>({
    resolver: zodResolver(requestInvitationSchema),
    defaultValues: {
      roleId: 0,
      email: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
    },
  });

  const onSubmit: SubmitHandler<z.input<typeof requestInvitationSchema>> = async (data) => {
    const resultAction = await dispatch(requestInvitationThunk(data));

    if (requestInvitationThunk.rejected.match(resultAction)) {
      const payload = resultAction.payload;
      if (Array.isArray(payload)) {
        applyServerValidationErrors(payload as ServerValidationError[], setError);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        {' '}
        {/* Increased max-width slightly for the name grid */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Request Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {requestInvitationStatus === 'success' ? (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <CheckCircle2 className="h-20 w-20 text-green-600" />
              <p className="text-lg font-medium text-gray-800">
                Your invitation request has been sent
              </p>
              <p className="text-sm text-gray-500">
                If the email is eligible, you will receive an invitation shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name (Optional)</Label>
                  <Input id="middleName" placeholder="Quincy" {...register('middleName')} />
                  {errors.middleName && (
                    <p className="text-xs text-red-500">{errors.middleName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix (Optional)</Label>
                  <Input id="suffix" placeholder="Jr., III" {...register('suffix')} />
                  {errors.suffix && <p className="text-xs text-red-500">{errors.suffix.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="enter@email.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleId">Requested Role</Label>
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
                {errors.roleId && <p className="text-xs text-red-500">{errors.roleId.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={requestInvitationStatus === 'loading'}
              >
                {requestInvitationStatus === 'loading' ? 'Sending...' : 'Request Invitation'}
              </Button>
            </form>
          )}

          <Separator />

          <div className="text-center text-sm text-gray-500">
            <a href="/auth/login" className="underline hover:text-gray-700">
              Back to login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestInvitationPage;
