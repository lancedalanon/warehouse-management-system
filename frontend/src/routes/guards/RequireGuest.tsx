import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '@/stores';
import { refreshThunk } from '@/features/auth/stores/auth.slice';

export default function RequireGuest() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { user, accessToken, authStatus } = useSelector((state: RootState) => state.auth);

  const hasRefreshedRef = useRef(false);

  // Paths where guest check should NOT redirect
  const whitelist = ['/auth/verify-email'];

  useEffect(() => {
    // Only attempt refresh if not already done, user not authenticated, and not on a whitelisted page
    if (
      !hasRefreshedRef.current &&
      !user &&
      !accessToken &&
      authStatus === 'idle' &&
      !whitelist.includes(location.pathname)
    ) {
      hasRefreshedRef.current = true;
      dispatch(refreshThunk());
    }
  }, [dispatch, user, accessToken, authStatus, location.pathname]);

  // While authenticating / refreshing
  if (authStatus === 'loading') {
    return <div>Loading...</div>;
  }

  // Authenticated redirect away from public pages, unless on a whitelisted page
  if ((user || accessToken) && !whitelist.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Guest user continue to public page
  return <Outlet />;
}
