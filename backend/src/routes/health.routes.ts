import { Router } from 'express';
import { HealthController } from '@/controllers/HealthController';
import { container } from 'tsyringe';

const router = Router();

/**
 * Dependency wiring (once)
 */
const healthController = container.resolve(HealthController);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Health check successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-12-22T08:34:42.146Z
 *                 meta:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 error:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *                 requestId:
 *                   type: string
 *                   format: uuid
 *                   example: 6f6a57bd-b3c6-479c-8645-7ee3e8c38e74
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-12-22T08:34:42.148Z
 */
router.get('/', healthController.check);

export default router;
