import { Router } from 'express';
import auditLogRoutes from '@/routes/audit-log.routes';
import authRoutes from '@/routes/auth.routes';
import healthRoutes from '@/routes/health.routes';
import dashboardRoutes from '@/routes/dashboard.routes';
import userRoutes from '@/routes/user.routes';
import roleRoutes from '@/routes/role.routes';
import orderRoutes from '@/routes/order.routes';
import productRoutes from '@/routes/product.routes';
import locationRoutes from '@/routes/location.routes';
import inventoryRoutes from '@/routes/inventory.routes';
import inventoryMovementRoutes from '@/routes/inventory-movement.routes';
import invitationRequestRoutes from '@/routes/invitation-request.routes';

const router = Router();

router.use('/audit-logs', auditLogRoutes);
router.use('/auth', authRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/health', healthRoutes);
router.use('/inventories', inventoryRoutes);
router.use('/invitation-requests', invitationRequestRoutes);
router.use('/inventory-movements', inventoryMovementRoutes);
router.use('/locations', locationRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);

export default router;
