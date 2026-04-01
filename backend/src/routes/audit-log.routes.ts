import { Router } from 'express';
import { container } from 'tsyringe';
import { AuditLogController } from '@/controllers/AuditLogController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency injection
 */
const auditLogController = container.resolve(AuditLogController);

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: System audit log endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         event:
 *           type: string
 *         description:
 *           type: string
 *         auditableType:
 *           type: string
 *         auditableId:
 *           type: integer
 *         userId:
 *           type: integer
 *           nullable: true
 *         metadata:
 *           type: object
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Retrieve a paginated list of audit logs
 *     tags: [Audit Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
 *       - in: query
 *         name: auditableType
 *         schema:
 *           type: string
 *       - in: query
 *         name: auditableId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 meta:
 *                   type: object
 */

/**
 * Get paginated audit logs
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
  auditLogController.getAuditLogs,
);

/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     summary: Retrieve a single audit log
 *     tags: [Audit Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
 */

/**
 * Get single audit log
 */
router.get(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.INVENTORY_STAFF,
    Role.AUDITOR,
  ]),
  auditLogController.getAuditLog,
);

export default router;
