import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const ctrl   = new NotificationController();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     userHeader:
 *       type: apiKey
 *       in: header
 *       name: x-user-id
 *       description: User ID injected by the API Gateway / Nginx auth proxy
 *
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "664f1a2b3c4d5e6f7a8b9c0d"
 *         userId:
 *           type: string
 *           example: "user_123"
 *         title:
 *           type: string
 *           example: "Order Shipped"
 *         body:
 *           type: string
 *           example: "Your order #456 is on the way"
 *         status:
 *           type: string
 *           enum: [unread, read]
 *           example: "unread"
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *           example: { orderId: "ORDER_456", trackingUrl: "https://..." }
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PaginatedNotifications:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         total:
 *           type: integer
 *           example: 42
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         totalPages:
 *           type: integer
 *           example: 3
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Notification not found or unauthorized"
 */


/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: In-app notification management.
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get paginated notifications
 *     description: >
 *       Returns a paginated list of notifications for the authenticated user.
 *       Supports filtering by status, and date range.
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unread, read]
 *         description: Filter by read/unread status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range (ISO 8601)
 *         example: "2025-01-01T00:00:00Z"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range (ISO 8601)
 *         example: "2025-12-31T23:59:59Z"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedNotifications'
 *       401:
 *         description: Missing x-user-id header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authMiddleware, ctrl.getAll.bind(ctrl));


/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     description: Returns the number of unread notifications. Used for badge counters in the UI.
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 7
 *       401:
 *         description: Missing x-user-id header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/unread-count", authMiddleware, ctrl.getUnreadCount.bind(ctrl));

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Marks every unread notification as read for the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     responses:
 *       200:
 *         description: Number of notifications updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 updated:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Missing x-user-id header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/read-all", authMiddleware, ctrl.markAllAsRead.bind(ctrl));

/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Delete all notifications
 *     description: >
 *       Deletes all notifications for the authenticated user.
 *       Optionally filter by `type` to delete only a specific category.
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     responses:
 *       200:
 *         description: Number of notifications deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deleted:
 *                   type: integer
 *                   example: 12
 *       401:
 *         description: Missing x-user-id header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/", authMiddleware, ctrl.deleteAll.bind(ctrl));

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification MongoDB ObjectId
 *         example: "664f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Updated notification object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/read", authMiddleware, ctrl.markAsRead.bind(ctrl));

/**
 * @swagger
 * /notifications/{id}/unread:
 *   patch:
 *     summary: Mark a notification as unread
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification MongoDB ObjectId
 *         example: "664f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Updated notification object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/unread", authMiddleware, ctrl.markAsUnread.bind(ctrl));

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - userHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification MongoDB ObjectId
 *         example: "664f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: Notification deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deleted:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Notification not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", authMiddleware, ctrl.deleteOne.bind(ctrl));

export default router;
