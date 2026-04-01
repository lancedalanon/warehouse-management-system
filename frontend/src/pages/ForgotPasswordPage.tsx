import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { applyServerValidationErrors } from '@/lib/form-handler';
import { forgotPasswordThunk } from '@/features/auth/stores/auth.thunks';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/schemas/forgot-password.schema';
import type { FC } from 'react';
import type { RootState, AppDispatch } from '@/stores';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { forgotPasswordStatus } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    const resultAction = await dispatch(forgotPasswordThunk(data));

    if (forgotPasswordThunk.rejected.match(resultAction)) {
      const payload = resultAction.payload;

      if (Array.isArray(payload)) {
        applyServerValidationErrors(payload as ServerValidationError[], setError);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {forgotPasswordStatus === 'success' ? (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <CheckCircle2 className="h-20 w-20 text-green-600" />
              <p className="text-lg font-medium text-gray-800">Reset link sent</p>
              <p className="text-sm text-gray-500">
                If the email exists, a password reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordStatus === 'loading'}
              >
                {forgotPasswordStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
