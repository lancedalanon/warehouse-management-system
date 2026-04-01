import { Router } from 'express';
import { container } from 'tsyringe';
import { InventoryController } from '@/controllers/InventoryController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency injection
 */
const inventoryController = container.resolve(InventoryController);

/**
 * @swagger
 * tags:
 *   name: Inventories
 *   description: Inventory management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         storedQuantity:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateInventoryDTO:
 *       type: object
 *       required:
 *         - productId
 *         - locationId
 *       properties:
 *         productId:
 *           type: integer
 *         locationId:
 *           type: integer
 *
 *     UpdateInventoryDTO:
 *       oneOf:
 *         - type: object
 *           required: [action, storedQuantity]
 *           properties:
 *             action:
 *               type: string
 *               enum: [store]
 *             storedQuantity:
 *               type: integer
 *               minimum: 0
 *             notes:
 *               type: string
 *               nullable: true
 *
 *         - type: object
 *           required: [action, shippedQuantity]
 *           properties:
 *             action:
 *               type: string
 *               enum: [ship]
 *             shippedQuantity:
 *               type: integer
 *               minimum: 1
 *             notes:
 *               type: string
 *               nullable: true
 *
 *         - type: object
 *           required: [action, transferredQuantity, locationId]
 *           properties:
 *             action:
 *               type: string
 *               enum: [transfer]
 *             transferredQuantity:
 *               type: integer
 *               minimum: 1
 *             locationId:
 *               type: integer
 *             notes:
 *               type: string
 *               nullable: true
 *
 *         - type: object
 *           required: [action, writeOffQuantity, writeOffFrom]
 *           properties:
 *             action:
 *               type: string
 *               enum: [write-off]
 *             writeOffQuantity:
 *               type: integer
 *               minimum: 1
 *             writeOffFrom:
 *               type: string
 *               enum:
 *                 - store
 *                 - reserve
 *                 - ship
 *                 - transfer
 *             notes:
 *               type: string
 *               nullable: true
 */

/**
 * @swagger
 * /api/inventories:
 *   get:
 *     summary: Retrieve a paginated list of inventories
 *     tags: [Inventories]
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
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inventory'
 *                 meta:
 *                   type: object
 */

/**
 * Get inventories
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
  inventoryController.getInventories,
);

/**
 * @swagger
 * /api/inventories/{id}:
 *   get:
 *     summary: Get a single inventory by ID
 *     tags: [Inventories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory not found
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
  inventoryController.getInventory,
);

/**
 * @swagger
 * /api/inventories:
 *   post:
 *     summary: Create a new inventory
 *     tags: [Inventories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInventoryDTO'
 *     responses:
 *       201:
 *         description: Inventory created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Product or Location not found
 */
router.post(
  '/',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.INVENTORY_STAFF,
  ]),
  inventoryController.createInventory,
);

/**
 * @swagger
 * /api/inventories/{id}:
 *   put:
 *     summary: Perform an inventory action (set available, reserve, ship, transfer, or write off)
 *     tags: [Inventories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInventoryDTO'
 *           examples:
 *             setAvailable:
 *               summary: Set available quantity
 *               value:
 *                 action: store
 *                 storedQuantity: 100
 *                 notes: Initial stocking
 *
 *             ship:
 *               summary: Ship stock
 *               value:
 *                 action: ship
 *                 shippedQuantity: 10
 *
 *             transfer:
 *               summary: Transfer stock to another location
 *               value:
 *                 action: transfer
 *                 transferredQuantity: 50
 *                 locationId: 2
 *
 *             writeOff:
 *               summary: Write off damaged stock
 *               value:
 *                 action: write-off
 *                 writeOffQuantity: 5
 *                 writeOffFrom: store
 *                 notes: Damaged during handling
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Inventory, Product, or Location not found
 */
router.put(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.INVENTORY_STAFF,
  ]),
  inventoryController.updateInventory,
);

/**
 * @swagger
 * /api/inventories/{id}:
 *   delete:
 *     summary: Delete an inventory by ID
 *     tags: [Inventories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory not found
 */
router.delete(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.INVENTORY_STAFF,
  ]),
  inventoryController.deleteInventory,
);

export default router;
