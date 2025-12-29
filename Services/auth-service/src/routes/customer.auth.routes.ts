import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { authenticateCustomer } from "../middleware/auth.middleware";
import * as customerAuthController from "../controllers/customer.auth.controller";
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  customerResetPasswordSchema,
} from "../utils/validators";
import authController from "../controllers/auth.controller";

const router = Router();

/**
 * @swagger
 * /auth/customer/register:
 *   post:
 *     summary: Register new customer
 *     description: Register and receive OTP via email for verification
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               phone:
 *                 type: string
 *                 example: "+201234567890"
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent to email
 *       400:
 *         description: Email already exists
 */
router.post(
  "/register",
  validate(registerSchema),
  customerAuthController.register
);

/**
 * @swagger
 * /auth/customer/login:
 *   post:
 *     summary: Customer login
 *     tags: [Customer Auth]
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
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  validate(loginSchema),
  customerAuthController.login
);

/**
 * @swagger
 * /auth/customer/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     description: Verify email address using the 6-digit OTP code
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-email",
  validate(verifyOTPSchema),
  customerAuthController.verifyEmail
);

/**
 * @swagger
 * /auth/customer/resend-otp:
 *   post:
 *     summary: Resend verification OTP
 *     description: Request a new OTP code for email verification
 *     tags: [Customer Auth]
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
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 *       400:
 *         description: Email already verified
 */
router.post(
  "/resend-otp",
  validate(resendOTPSchema),
  customerAuthController.resendVerificationOTP
);

/**
 * @swagger
 * /auth/customer/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Customer Auth]
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
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect current password
 */
router.post(
  "/change-password",
  authenticateCustomer,
  validate(changePasswordSchema),
  customerAuthController.changePassword
);

/**
 * @swagger
 * /auth/customer/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     description: Send OTP to email for password reset
 *     tags: [Customer Auth]
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
 *     responses:
 *       200:
 *         description: Reset OTP sent if email exists
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  customerAuthController.forgotPassword
);

/**
 * @swagger
 * /auth/customer/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     description: Validate the OTP before resetting password
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified, can proceed to reset password
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-reset-otp",
  validate(verifyOTPSchema),
  customerAuthController.verifyResetOTP
);

/**
 * @swagger
 * /auth/customer/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Reset password using verified OTP
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - new_password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP
 */
router.post(
  "/reset-password",
  validate(customerResetPasswordSchema),
  customerAuthController.resetPassword
);

/**
 * @swagger
 * /auth/customer/logout:
 *   post:
 *     summary: Logout (current device)
 *     tags: [Customer Auth]
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
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  "/logout",
  authenticateCustomer,
  customerAuthController.customerLogout
);

/**
 * @swagger
 * /auth/customer/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
router.post(
  "/logout-all",
  authenticateCustomer,
  authController.logoutAllDevices
);

export default router;