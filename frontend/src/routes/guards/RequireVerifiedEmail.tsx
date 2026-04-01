import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '@/stores/types';
import type { User } from '@/features/users/types/user.types';

export const RequireVerifiedEmail = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const isVerified = Boolean((user as User).emailVerifiedAt);

  if (!isVerified) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};
