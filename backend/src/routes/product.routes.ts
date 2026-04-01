import { Router } from 'express';
import { container } from 'tsyringe';
import { ProductController } from '@/controllers/ProductController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency wiring (once)
 */
const productController = container.resolve(ProductController);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         unitType:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateProductDTO:
 *       type: object
 *       required:
 *         - sku
 *         - name
 *         - unitType
 *       properties:
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         unitType:
 *           type: string
 *         receivedQuantity:
 *          type: integer
 *          example: 100
 *     UpdateProductDTO:
 *       type: object
 *       properties:
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         unitType:
 *           type: string
 *     AddReceivedQuantityDTO:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Number of units received
 *           example: 100
 *         notes:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           description: Optional notes about the received items, e.g., delivery info or PO number
 *           example: "Delivery from supplier PO-3341"
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Retrieve a paginated list of products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort direction
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *         description: Filter by SKU
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by product name
 *       - in: query
 *         name: unitType
 *         schema:
 *           type: string
 *         description: Filter by unit type
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                     prevPage:
 *                       type: integer
 *                       nullable: true
 *                     offset:
 *                       type: integer
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
  productController.getProducts,
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
  productController.getProduct,
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductDTO'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       409:
 *         description: Conflict – SKU already exists
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
  productController.createProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductDTO'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       409:
 *         description: Conflict – SKU already exists
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
  productController.updateProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
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
  productController.deleteProduct,
);

/**
 * @swagger
 * /api/products/{id}/receive:
 *   post:
 *     summary: Receive stock for a product
 *     description: Adds physical stock to a product and increases its
 *                  received quantity. Does not create or modify inventory locations.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddReceivedQuantityDTO'
 *     responses:
 *       200:
 *         description: Quantity successfully received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: integer
 *                 receivedAdded:
 *                   type: integer
 *                 newReceivedQuantity:
 *                   type: integer
 *       404:
 *         description: Product not found
 *       422:
 *         description: Validation error
 */
router.post(
  '/:id/receive',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([
    Role.SUPERADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.INVENTORY_STAFF,
  ]),
  productController.addReceivedQuantity,
);

export default router;
