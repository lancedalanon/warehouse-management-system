import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '@/controllers/UserController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency wiring (once)
 */
const userController = container.resolve(UserController);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstName:
 *           type: string
 *         middleName:
 *           type: string
 *           nullable: true
 *         lastName:
 *           type: string
 *         suffix:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateUserDTO:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         firstName:
 *           type: string
 *         middleName:
 *           type: string
 *           nullable: true
 *         lastName:
 *           type: string
 *         suffix:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           example: string@example.com
 *         password:
 *           type: string
 *     UpdateUserDTO:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         firstName:
 *           type: string
 *         middleName:
 *           type: string
 *           nullable: true
 *         lastName:
 *           type: string
 *         suffix:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           example: string@example.com
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a paginated list of users
 *     tags: [Users]
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
 *         description: Number of users per page
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
 *         name: firstName
 *         schema:
 *           type: string
 *         description: Filter by first name
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: Filter by last name
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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
  authorizeRoles([Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]),
  userController.getUsers,
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]),
  userController.getUser,
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDTO'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       409:
 *         description: Conflict – email already exists
 */
router.post(
  '/',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN]),
  userController.createUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDTO'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict – email already exists
 */
router.put(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN]),
  userController.updateUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN]),
  userController.deleteUser,
);

export default router;
