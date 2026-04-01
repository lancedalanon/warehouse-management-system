import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '@/controllers/AuthController';
import { authenticate } from '@/middlewares/authentication.middleware';

const router = Router();
const authController = () => container.resolve(AuthController);
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authController().login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Access token refreshed
 */
router.post('/refresh', authController().refreshAccessToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authController().logout);

/**
 * @swagger
 * /api/auth/request-invitation:
 *   post:
 *     summary: Request an invitation
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Invitation requested
 */
router.post('/request-invitation', authController().requestInvitation);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Password reset requested
 */
router.post('/forgot-password', authController().forgotPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password using reset token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           example: user@example.com
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: reset-token-value
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewStrongPassword123!
 *               confirmPassword:
 *                 type: string
 *                 example: NewStrongPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', authController().changePassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user details
 */
router.get('/me', authenticate, authController().me);

/**
 * @swagger
 * /api/auth/account:
 *   patch:
 *     summary: Update current authenticated user's account info
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               suffix:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 */
router.patch('/account', authenticate, authController().updateAccountInfo);

/**
 * @swagger
 * /api/auth/change-email:
 *   patch:
 *     summary: Change the current authenticated user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - currentPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               currentPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       401:
 *         description: Unauthorized or incorrect password
 */
router.patch('/change-email', authenticate, authController().changeEmail);

/**
 * @swagger
 * /api/auth/update-password:
 *   patch:
 *     summary: Update current authenticated user's password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.patch('/update-password', authenticate, authController().updatePassword);

/**
 * @swagger
 * /api/auth/request-email-verification:
 *   post:
 *     summary: Send email verification link
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []   # User must be authenticated
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/request-email-verification',
  authenticate,
  authController().requestEmailVerification,
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify user's email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: token-value
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
router.get('/verify-email', authController().verifyEmail);

export default router;
