import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { applyServerValidationErrors } from '@/lib/form-handler';
import { changePasswordThunk } from '@/features/auth/stores/auth.thunks';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/features/auth/schemas/reset-password.schema';
import type { FC } from 'react';
import type { RootState, AppDispatch } from '@/stores';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { resetPasswordStatus } = useSelector((state: RootState) => state.auth);
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (resetPasswordStatus === 'success') {
      const timer = setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [resetPasswordStatus, navigate]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    const resultAction = await dispatch(
      changePasswordThunk({
        email,
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    );

    if (changePasswordThunk.rejected.match(resultAction)) {
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
          <CardTitle className="text-2xl">Reset Password</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {resetPasswordStatus === 'success' ? (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <CheckCircle2 className="h-20 w-20 text-green-600" />
              <p className="text-lg font-medium text-gray-800">Password reset successful</p>
              <p className="text-sm text-gray-500">Redirecting you to the login page…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={resetPasswordStatus === 'loading'}>
                {resetPasswordStatus === 'loading' ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;
