import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  authenticateFleetOperator,
  authenticateCompanyUser,
} from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  logoutSchema,
} from "../utils/validators";

const router = Router();

/**
 * @swagger
 * /auth/fleet/login:
 *   post:
 *     summary: Fleet operator login
 *     description: Authenticate fleet operator and receive JWT tokens
 *     tags: [Fleet Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@rovex.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       $ref: '#/components/schemas/FleetOperator'
 *                     tokens:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Account suspended or deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/fleet/login", authController.fleetLogin);

/**
 * @swagger
 * /auth/fleet/change-password:
 *   post:
 *     summary: Change fleet operator password
 *     description: Change password for the authenticated fleet operator
 *     tags: [Fleet Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *                 example: OldPassword123!
 *                 description: Current password
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: NewPassword123!
 *                 description: New password (8-128 chars, must include uppercase, lowercase, number, and special character @$!%*?&)
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *                 description: Must match new_password
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     statusCode:
 *                       type: integer
 *                       example: 400
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: new_password
 *                           message:
 *                             type: string
 *                             example: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.post(
  "/fleet/change-password",
  authenticateFleetOperator,
  validate(changePasswordSchema),
  authController.changePasswordFleet
);

/**
 * @swagger
 * /auth/fleet/forgot-password:
 *   post:
 *     summary: Request password reset for fleet operator
 *     description: Send password reset link/code to fleet operator's email
 *     tags: [Fleet Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@rovex.com
 *                 description: Fleet operator email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: Password reset link has been sent to your email
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: admin@rovex.com
 *                     expires_in:
 *                       type: string
 *                       example: 15 minutes
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Fleet operator not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No account found with this email address
 *       429:
 *         description: Too many requests - Rate limited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many password reset attempts. Please try again later
 */
router.post(
  "/fleet/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPasswordFleet
);

/**
 * @swagger
 * /auth/fleet/reset-password:
 *   post:
 *     summary: Reset fleet operator password
 *     description: Reset password using token received via email
 *     tags: [Fleet Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - token
 *               - new_password
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: FO_001
 *                 description: Fleet operator ID
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: Password reset token from email
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: NewPassword123!
 *                 description: New password (8-128 chars, must include uppercase, lowercase, number, and special character @$!%*?&)
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully. You can now login with your new password
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: new_password
 *                           message:
 *                             type: string
 *                             example: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid or expired reset token
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_RESET_TOKEN
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 */
router.post(
  "/fleet/reset-password",
  validate(resetPasswordSchema),
  authController.resetPasswordFleet
);

/**
 * @swagger
 * /auth/fleet/logout:
 *   post:
 *     summary: Fleet operator logout (single device)
 *     description: Logout from current device by blacklisting the refresh token
 *     tags: [Fleet Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: The refresh token to blacklist
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error - Refresh token is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: refresh_token
 *                           message:
 *                             type: string
 *                             example: Refresh token is required
 *       401:
 *         description: Unauthorized - Invalid or missing access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.post(
  "/fleet/logout",
  authenticateFleetOperator,
  validate(logoutSchema),
  authController.fleetLogout
);

/**
 * @swagger
 * /auth/fleet/logout-all:
 *   post:
 *     summary: Fleet operator logout from all devices
 *     description: Logout from all devices by incrementing token version (invalidates all existing tokens)
 *     tags: [Fleet Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
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
 *                   example: Logged out from all devices successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices_logged_out:
 *                       type: integer
 *                       example: 3
 *                       description: Number of devices logged out
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.post(
  "/fleet/logout-all",
  authenticateFleetOperator,
  authController.logoutAllDevices
);

/**
 * @swagger
 * /auth/company/login:
 *   post:
 *     summary: Company user login
 *     description: Authenticate company user with email and password. Company is automatically detected from the email.
 *     tags: [Company Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: manager@company.com
 *                 description: Company user email address (must be unique across platform)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Manager123!
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: CU_001
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         email:
 *                           type: string
 *                           example: manager@company.com
 *                         name:
 *                           type: string
 *                           example: Jane Smith
 *                         role:
 *                           type: string
 *                           enum: [admin, manager, dispatcher, analyst]
 *                           example: manager
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['view_vehicles', 'manage_bookings']
 *                         location_access:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['LOC_001', 'LOC_002']
 *                         status:
 *                           type: string
 *                           enum: [active, suspended, deactivated]
 *                           example: active
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refresh_token:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         expires_in:
 *                           type: integer
 *                           example: 3600
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       403:
 *         description: Account suspended or company inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Your account has been suspended
 */
router.post("/company/login", authController.companyLogin);

/**
 * @swagger
 * /auth/company/change-password:
 *   post:
 *     summary: Change company user password
 *     description: Change password for the authenticated company user
 *     tags: [Company Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *                 example: OldPassword123!
 *                 description: Current password
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: NewPassword123!
 *                 description: New password (8-128 chars, must include uppercase, lowercase, number, and special character @$!%*?&)
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *                 description: Must match new_password
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: new_password
 *                           message:
 *                             type: string
 *                             example: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
 *       401:
 *         description: Unauthorized - Invalid or missing token, or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Current password is incorrect
 */
router.post(
  "/company/change-password",
  authenticateCompanyUser,
  validate(changePasswordSchema),
  authController.changePasswordCompany
);

/**
 * @swagger
 * /auth/company/forgot-password:
 *   post:
 *     summary: Request password reset for company user
 *     description: Send password reset link/code to company user's email
 *     tags: [Company Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: manager@company.com
 *                 description: Company user email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: Password reset link has been sent to your email
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: manager@company.com
 *                     expires_in:
 *                       type: string
 *                       example: 15 minutes
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Company user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No account found with this email address
 *       429:
 *         description: Too many requests - Rate limited
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many password reset attempts. Please try again later
 */
router.post(
  "/company/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPasswordCompany
);

/**
 * @swagger
 * /auth/company/reset-password:
 *   post:
 *     summary: Reset company user password
 *     description: Reset password using token received via email
 *     tags: [Company Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - token
 *               - new_password
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: CU_001
 *                 description: Company user ID
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: Password reset token from email
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: NewPassword123!
 *                 description: New password (8-128 chars, must include uppercase, lowercase, number, and special character @$!%*?&)
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully. You can now login with your new password
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: new_password
 *                           message:
 *                             type: string
 *                             example: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid or expired reset token
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_RESET_TOKEN
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 */
router.post(
  "/company/reset-password",
  validate(resetPasswordSchema),
  authController.resetPasswordCompany
);

/**
 * @swagger
 * /auth/company/logout:
 *   post:
 *     summary: Company user logout (single device)
 *     description: Logout from current device by blacklisting the refresh token
 *     tags: [Company Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: The refresh token to blacklist
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error - Refresh token is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: refresh_token
 *                           message:
 *                             type: string
 *                             example: Refresh token is required
 *       401:
 *         description: Unauthorized - Invalid or missing access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.post(
  "/company/logout",
  authenticateCompanyUser,
  validate(logoutSchema),
  authController.companyLogout
);

/**
 * @swagger
 * /auth/company/logout-all:
 *   post:
 *     summary: Company user logout from all devices
 *     description: Logout from all devices by incrementing token version (invalidates all existing tokens)
 *     tags: [Company Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
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
 *                   example: Logged out from all devices successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices_logged_out:
 *                       type: integer
 *                       example: 3
 *                       description: Number of devices logged out
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.post(
  "/company/logout-all",
  authenticateCompanyUser,
  authController.logoutAllDevices
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Token]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                       description: New access token
 *                     expires_in:
 *                       type: integer
 *                       example: 3600
 *                       description: Token expiry time in seconds
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Refresh token is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid or expired refresh token
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_REFRESH_TOKEN
 */
router.post("/refresh", authController.refreshToken);


export default router;
