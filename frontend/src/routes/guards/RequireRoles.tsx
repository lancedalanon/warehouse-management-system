import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '@/stores/types';
import { Role } from '@/enums/Role';

interface RequireRolesProps {
  roles: Role[];
  fallback?: string;
}

/**
 * Route guard that only allows access if the user has at least one of the specified roles.
 * Otherwise, redirects to the fallback (default: /dashboard).
 */
export const RequireRoles: React.FC<RequireRolesProps> = ({ roles, fallback = '/dashboard' }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return <Navigate to={fallback} replace />;

  const hasAccess = user.roles?.some((r) => roles.includes(r.code as Role));

  if (!hasAccess) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};
