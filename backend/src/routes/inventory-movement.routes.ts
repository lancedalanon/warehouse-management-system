import { Router } from 'express';
import { container } from 'tsyringe';
import { InventoryMovementController } from '@/controllers/InventoryMovementController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency injection
 */
const inventoryMovementController = container.resolve(
  InventoryMovementController,
);

/**
 * @swagger
 * tags:
 *   name: Inventory Movements
 *   description: Inventory movement history endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryMovement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         inventory:
 *           $ref: '#/components/schemas/Inventory'
 *         fromLocation:
 *           $ref: '#/components/schemas/Location'
 *           nullable: true
 *         toLocation:
 *           $ref: '#/components/schemas/Location'
 *           nullable: true
 *         type:
 *           type: string
 *         quantity:
 *           type: integer
 *         notes:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/inventory-movements:
 *   get:
 *     summary: Retrieve a paginated list of inventory movements
 *     tags: [Inventory Movements]
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
 *         name: inventoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fromLocationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: toLocationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory movements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryMovement'
 *                 meta:
 *                   type: object
 */

/**
 * Get inventory movements
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
  inventoryMovementController.getInventoryMovements,
);

export default router;
