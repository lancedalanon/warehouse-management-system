import { Router } from 'express';
import { container } from 'tsyringe';
import { InvitationRequestController } from '@/controllers/InvitationRequestController';
import { authenticate } from '@/middlewares/authentication.middleware';
import { authorizeRoles } from '@/middlewares/authorization.middleware';
import { Role } from '@/enums/Role';
import { verifiedEmailOnly } from '@/middlewares/verified-email-only.middleware';

const router = Router();

/**
 * Dependency wiring (once)
 */
const invitationRequestController = container.resolve(
  InvitationRequestController,
);

/**
 * @swagger
 * tags:
 *   name: InvitationRequests
 *   description: Invitation request management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InvitationRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         joinedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         declinedAt:
 *           type: string
 *           format: date-time
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
 * /api/invitation-requests:
 *   get:
 *     summary: Retrieve a paginated list of invitation requests
 *     tags: [InvitationRequests]
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
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [joined, declined, pending]
 *     responses:
 *       200:
 *         description: Invitation requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InvitationRequest'
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
  authorizeRoles([Role.SUPERADMIN]),
  invitationRequestController.getInvitationRequests,
);

/**
 * @swagger
 * /api/invitation-requests/{id}:
 *   get:
 *     summary: Get a single invitation request by ID
 *     tags: [InvitationRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invitation request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvitationRequest'
 *       404:
 *         description: Invitation request not found
 */
router.get(
  '/:id',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN]),
  invitationRequestController.getInvitationRequest,
);

/**
 * @swagger
 * /api/invitation-requests/{id}/decline:
 *   put:
 *     summary: Decline an invitation request
 *     tags: [InvitationRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invitation request declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvitationRequest'
 *       404:
 *         description: Invitation request not found
 */
router.put(
  '/:id/decline',
  authenticate,
  verifiedEmailOnly,
  authorizeRoles([Role.SUPERADMIN]),
  invitationRequestController.declineInvitationRequest,
);

export default router;
