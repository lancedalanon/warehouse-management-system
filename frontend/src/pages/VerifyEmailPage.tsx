import { type FC, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmailThunk } from '@/features/auth/stores/auth.thunks';
import { useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '@/stores/types';

export const VerifyEmailPage: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  // Get token from query string
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const { verifyEmailStatus, verifyEmailMessage, error } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!token) return;

    dispatch(verifyEmailThunk(token));
  }, [token, dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 py-8 text-center">
          {/* No token provided */}
          {!token && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-20 w-20 text-red-600" />
              <p className="text-lg font-medium text-gray-800">
                Token not found. Please check your verification link.
              </p>
            </div>
          )}

          {/* Token verification in progress */}
          {token && verifyEmailStatus === 'loading' && <p>Verifying your email...</p>}

          {/* Success */}
          {token && verifyEmailStatus === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="h-20 w-20 text-green-600" />
              <p className="text-lg font-medium text-gray-800">{verifyEmailMessage}</p>
            </div>
          )}

          {/* Error */}
          {token && verifyEmailStatus === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-20 w-20 text-red-600" />
              <p className="text-lg font-medium text-gray-800">
                {error || 'Failed to verify your email. The token may have expired.'}
              </p>
            </div>
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

export default VerifyEmailPage;
