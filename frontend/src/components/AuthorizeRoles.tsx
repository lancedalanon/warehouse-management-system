import type { FC, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/stores/types';
import { Role } from '@/enums/Role';

interface AuthorizedProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders its children only if the user has at least one of the specified roles.
 * Otherwise, renders the optional fallback (default: nothing).
 */
export const AuthorizeRoles: FC<AuthorizedProps> = ({ roles, children, fallback = null }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user?.roles) return <>{fallback}</>;

  const hasAccess = user.roles.some((r) => roles.includes(r.code as Role));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
