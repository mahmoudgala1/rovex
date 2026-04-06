import { Router } from "express";
import { fcmTokenController } from "../controllers/fcmToken.controller";
import { authMiddleware } from "../middleware/auth.middleware"; 

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FCM Tokens
 *   description: Firebase Cloud Messaging token management for push notifications
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FCMToken:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "663f1a2b4e4f1a2b4e4f1a2b"
 *         userId:
 *           type: string
 *           example: "663f1a2b4e4f1a2b4e4f1a2c"
 *         fcmToken:
 *           type: string
 *           example: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *         platform:
 *           type: string
 *           enum: [android, ios, web]
 *           example: android
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     RegisterFCMTokenRequest:
 *       type: object
 *       required:
 *         - fcmToken
 *       properties:
 *         fcmToken:
 *           type: string
 *           description: The Firebase Cloud Messaging device token
 *           example: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *         platform:
 *           type: string
 *           enum: [android, ios, web]
 *           default: android
 *           description: Device platform
 *           example: android
 *
 *     DeactivateFCMTokenRequest:
 *       type: object
 *       required:
 *         - fcmToken
 *       properties:
 *         fcmToken:
 *           type: string
 *           description: The FCM token to deactivate
 *           example: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /fcm-tokens:
 *   post:
 *     summary: Register or update an FCM token
 *     description: |
 *       Stores the FCM token for the authenticated user.
 *       If a token already exists for the same user + platform, it is updated (upsert).
 *       This endpoint should be called every time the app starts or the FCM token refreshes.
 *     tags: [FCM Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterFCMTokenRequest'
 *           example:
 *             fcmToken: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *             platform: "android"
 *     responses:
 *       201:
 *         description: FCM token registered or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FCMToken'
 *             example:
 *               success: true
 *               message: "FCM token registered successfully"
 *               data:
 *                 _id: "663f1a2b4e4f1a2b4e4f1a2b"
 *                 userId: "663f1a2b4e4f1a2b4e4f1a2c"
 *                 fcmToken: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *                 platform: "android"
 *                 isActive: true
 *                 createdAt: "2026-04-06T12:00:00.000Z"
 *                 updatedAt: "2026-04-06T12:00:00.000Z"
 *       400:
 *         description: Validation error – fcmToken is required
 *       401:
 *         description: Unauthorized – invalid or missing JWT
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  authMiddleware,
  fcmTokenController.register.bind(fcmTokenController)
);

/**
 * @swagger
 * /fcm-tokens:
 *   get:
 *     summary: Get all active FCM tokens for the current user
 *     description: Returns every active FCM token stored for the authenticated user (all platforms).
 *     tags: [FCM Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active FCM tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FCMToken'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "663f1a2b4e4f1a2b4e4f1a2b"
 *                   userId: "663f1a2b4e4f1a2b4e4f1a2c"
 *                   fcmToken: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *                   platform: "android"
 *                   isActive: true
 *                   createdAt: "2026-04-06T12:00:00.000Z"
 *                   updatedAt: "2026-04-06T12:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  authMiddleware,
  fcmTokenController.getMyTokens.bind(fcmTokenController)
);

/**
 * @swagger
 * /fcm-tokens:
 *   delete:
 *     summary: Deactivate a specific FCM token
 *     description: |
 *       Soft-deletes (sets `isActive = false`) a specific FCM token for the
 *       authenticated user. Useful when a user logs out on one device only.
 *     tags: [FCM Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeactivateFCMTokenRequest'
 *           example:
 *             fcmToken: "dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu..."
 *     responses:
 *       200:
 *         description: Token deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "FCM token deactivated"
 *       404:
 *         description: Token not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/",
  authMiddleware,
  fcmTokenController.deactivate.bind(fcmTokenController)
);

/**
 * @swagger
 * /fcm-tokens/all:
 *   delete:
 *     summary: Delete ALL FCM tokens for the current user
 *     description: |
 *       Hard-deletes every FCM token for the authenticated user.
 *       Use this on a "logout from all devices" action.
 *     tags: [FCM Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All tokens removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "2 token(s) removed"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/all",
  authMiddleware,
  fcmTokenController.deleteAll.bind(fcmTokenController)
);

export default router;
