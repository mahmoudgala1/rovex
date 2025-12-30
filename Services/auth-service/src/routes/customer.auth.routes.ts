import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { authenticateCustomer } from "../middleware/auth.middleware";
import * as customerAuthController from "../controllers/customer.auth.controller";
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
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
  "/customer/register",
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
  "/customer/login",
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
  "/customer/verify-email",
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
  "/customer/resend-otp",
  validate(resendOTPSchema),
  customerAuthController.resendVerificationOTP
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
  "/customer/logout",
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
  "/customer/logout-all",
  authenticateCustomer,
  authController.logoutAllDevices
);

export default router;