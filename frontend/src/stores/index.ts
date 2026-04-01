import { configureStore } from '@reduxjs/toolkit';
import auditLogsReducer from '@/features/audit-logs/stores/audit-log.slice';
import authReducer from '@/features/auth/stores/auth.slice';
import dashboardReducer from '@/features/dashboard/stores/dashboard.slice';
import locationsReducer from '@/features/locations/stores/location.slice';
import inventoriesReducer from '@/features/inventories/stores/inventory.slice';
import invitationRequestsReducer from '@/features/invitation-requests/stores/invitation-request.slice';
import productsReducer from '@/features/products/stores/product.slice';
import orderReducer from '@/features/orders/stores/order.slice';
import usersReducer from '@/features/users/stores/user.slice';
import rolesReducer from '@/features/roles/stores/role.slice';
import inventoryMovementsReducer from '@/features/inventory-movements/stores/inventory-movement.slice';

export const store = configureStore({
  reducer: {
    auditLogs: auditLogsReducer,
    auth: authReducer,
    dashboard: dashboardReducer,
    locations: locationsReducer,
    inventories: inventoriesReducer,
    inventoryMovements: inventoryMovementsReducer,
    invitationRequests: invitationRequestsReducer,
    orders: orderReducer,
    products: productsReducer,
    users: usersReducer,
    roles: rolesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
