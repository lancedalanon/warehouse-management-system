import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { AppDispatch, RootState } from '@/stores';
import { refreshThunk } from '@/features/auth/stores/auth.slice';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function RequireAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessToken, authStatus } = useSelector((state: RootState) => state.auth);

  const hasRefreshedRef = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial refresh if user is not authenticated yet
  useEffect(() => {
    if (!hasRefreshedRef.current && !user && !accessToken && authStatus === 'idle') {
      hasRefreshedRef.current = true;
      dispatch(refreshThunk());
    }
  }, [dispatch, user, accessToken, authStatus]);

  // Setup token refresh timer based on accessToken expiry
  useEffect(() => {
    // Clear any previous timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    if (accessToken?.expiredAt) {
      // expiredAt is assumed to be a UTC ISO string
      const expiryUTC = new Date(accessToken.expiredAt).getTime(); // milliseconds
      const now = Date.now();

      // Refresh 1 minute before actual expiry
      const refreshTime = expiryUTC - now - 60 * 1000;

      if (refreshTime > 0) {
        refreshTimerRef.current = setTimeout(() => {
          dispatch(refreshThunk());
        }, refreshTime);
      } else {
        // If already expired or within 1 min, refresh immediately
        dispatch(refreshThunk());
      }
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [accessToken, dispatch]);

  if (authStatus === 'loading') {
    return <div>Loading...</div>;
  }

  if (authStatus === 'error' || (!user && !accessToken)) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
}