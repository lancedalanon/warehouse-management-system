import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '@/features/auth/stores/auth.thunks';
import { applyServerValidationErrors } from '@/lib/form-handler';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login.schema';
import type { FC } from 'react';
import type { RootState, AppDispatch } from '@/stores/index';
import type { ServerValidationError } from '@/types/server-validation-errors.types';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loginStatus } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    const resultAction = await dispatch(loginThunk(data));

    if (loginThunk.fulfilled.match(resultAction)) {
      navigate('/', { replace: true });
      return;
    }

    if (loginThunk.rejected.match(resultAction)) {
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="mt-1"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="mt-1"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loginStatus === 'loading'}>
              {loginStatus === 'loading' ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Separator className="my-4" />

          <div className="space-y-2 text-center text-sm text-gray-500">
            <Link to="/auth/forgot-password" className="block underline hover:text-gray-700">
              Forgot your password?
            </Link>

            <span>
              No account yet?{' '}
              <Link to="/auth/request-invitation" className="underline hover:text-gray-700">
                Request an invitation
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
