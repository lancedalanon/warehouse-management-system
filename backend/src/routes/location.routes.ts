import { Router } from 'express';
import { container } from 'tsyringe';
import { LocationController } from '@/controllers/LocationController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency wiring (once)
 */
const locationController = container.resolve(LocationController);

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         capacity:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateLocationDTO:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         capacity:
 *           type: string
 *           nullable: true
 *     UpdateLocationDTO:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         capacity:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Retrieve a paginated list of locations
 *     tags: [Locations]
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
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
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
  locationController.getLocations,
);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get a single location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
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
  locationController.getLocation,
);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLocationDTO'
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       409:
 *         description: Conflict – code already exists
 */
router.post(
  '/',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]),
  locationController.createLocation,
);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update an existing location
 *     tags: [Locations]
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
 *             $ref: '#/components/schemas/UpdateLocationDTO'
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       409:
 *         description: Conflict – code already exists
 */
router.put(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]),
  locationController.updateLocation,
);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete a location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 */
router.delete(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]),
  locationController.deleteLocation,
);

export default router;
