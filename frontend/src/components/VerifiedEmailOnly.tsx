import type { FC, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/stores/types';
import type { User } from '@/features/users/types/user.types';

interface VerifiedEmailOnlyProps {
  children: ReactNode;
}

/**
 * Only renders children if the user's email is verified.
 */
export const VerifiedEmailOnly: FC<VerifiedEmailOnlyProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const isVerified = Boolean((user as User).emailVerifiedAt);

  if (!isVerified) return null;

  return <>{children}</>;
};
