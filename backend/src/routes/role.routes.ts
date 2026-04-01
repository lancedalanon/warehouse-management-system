import { Router } from 'express';
import { container } from 'tsyringe';
import { RoleController } from '@/controllers/RoleController';

const router = Router();

/**
 * Dependency wiring
 */
const roleController = container.resolve(RoleController);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management endpoints
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Retrieve a paginated list of roles
 *     tags: [Roles]
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
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/', roleController.getRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get a single role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       404:
 *         description: Role not found
 */
router.get('/:id', roleController.getRole);

export default router;
