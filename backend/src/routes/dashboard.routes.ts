import { Router } from 'express';
import { container } from 'tsyringe';
import { DashboardController } from '@/controllers/DashboardController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';

const router = Router();

/**
 * Dependency injection
 */
const dashboardController = container.resolve(DashboardController);

/**
 * @swagger
 * /api/dashboards:
 *   get:
 *     summary: Get dashboard data (authenticated)
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get(
  '/',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.INVENTORY_STAFF,
    Role.AUDITOR,
  ]),
  dashboardController.getDashboardData.bind(dashboardController),
);

/**
 * @swagger
 * /api/dashboards/export:
 *   get:
 *     summary: Export dashboard data (authenticated)
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [today, weekly, monthly, yearly]
 *     responses:
 *       200:
 *         description: Exported dashboard data
 */
router.get(
  '/export',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN, Role.WAREHOUSE_MANAGER, Role.AUDITOR]),
  dashboardController.exportToExcel.bind(dashboardController),
);

export default router;
