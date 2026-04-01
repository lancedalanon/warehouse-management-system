import { lazy, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import RequireAuth from '@/routes/guards/RequireAuth';
import RequireGuest from '@/routes/guards/RequireGuest';
import { RequireVerifiedEmail } from '@/routes/guards/RequireVerifiedEmail';
import { Role } from '@/enums/Role';
import { RequireRoles } from './guards/RequireRoles';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const RequestInvitationPage = lazy(() => import('@/pages/RequestInvitationPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const LocationsPage = lazy(() => import('@/pages/LocationsPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));
const InvitationRequestsPage = lazy(() => import('@/pages/InvitationRequestsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const OrderPage = lazy(() => import('@/pages/OrderPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));

export interface RouteConfig {
  path?: string;
  element?: ReactNode;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    element: <RequireGuest />,
    children: [
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: 'auth/reset-password', element: <ResetPasswordPage /> },
      { path: 'auth/request-invitation', element: <RequestInvitationPage /> },
      { path: 'auth/verify-email', element: <VerifyEmailPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <Navigate to="dashboard" replace /> },
      {
        element: <RequireVerifiedEmail />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          {
            element: <RequireRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]} />,
            children: [
              { path: 'users', element: <UsersPage /> },
              { path: 'audit-logs', element: <AuditLogsPage /> },
              { path: 'invitation-requests', element: <InvitationRequestsPage /> },
            ],
          },
          { path: 'products', element: <ProductsPage /> },
          { path: 'locations', element: <LocationsPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'orders', element: <OrderPage /> },
        ],
      },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
];
