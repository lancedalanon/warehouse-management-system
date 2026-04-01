import { Router } from 'express';
import { container } from 'tsyringe';
import { OrderController } from '@/controllers/OrderController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency injection
 */
const orderController = container.resolve(OrderController);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         inventorySourceId:
 *           type: integer
 *           description: Inventory source ID
 *         quantity:
 *           type: integer
 *           description: Quantity of the product
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         code:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         recipientName:
 *           type: string
 *         shippingAddress:
 *           type: string
 *         contactNumber:
 *           type: string
 *           nullable: true
 *         priorityLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *         expectedPickupDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateOrderDTO:
 *       type: object
 *       required:
 *         - code
 *         - recipientName
 *         - shippingAddress
 *         - items
 *       properties:
 *         code:
 *           type: string
 *         recipientName:
 *           type: string
 *         shippingAddress:
 *           type: string
 *         contactNumber:
 *           type: string
 *           nullable: true
 *         priorityLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *         expectedPickupDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *
 *     UpdateOrderDTO:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         recipientName:
 *           type: string
 *         shippingAddress:
 *           type: string
 *         contactNumber:
 *           type: string
 *           nullable: true
 *         priorityLevel:
 *           type: string
 *           enum: [low, medium, high]
 *         expectedPickupDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Retrieve a paginated list of orders
 *     tags: [Orders]
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
 *           enum: [id, code, status, createdAt]
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get(
  '/',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.INVENTORY_STAFF,
    Role.WAREHOUSE_MANAGER,
  ]),
  orderController.getOrders,
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.INVENTORY_STAFF,
    Role.WAREHOUSE_MANAGER,
  ]),
  orderController.getOrder,
);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderDTO'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post(
  '/',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.INVENTORY_STAFF,
    Role.WAREHOUSE_MANAGER,
  ]),
  orderController.createOrder,
);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an order's status, items, or warehouse metadata
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/UpdateOrderDTO'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Order not found
 */
router.put(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.INVENTORY_STAFF,
    Role.WAREHOUSE_MANAGER,
  ]),
  orderController.updateOrder,
);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.INVENTORY_STAFF,
    Role.WAREHOUSE_MANAGER,
  ]),
  orderController.deleteOrder,
);

export default router;
