import { Router } from "express";
import * as ctrl from "../controllers/orderIssue.controller";
import { extractUserFromHeaders } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router({ mergeParams: true }); // mounted at /orders/:orderId

/**
 * @swagger
 * tags:
 *   name: Order Issues
 *   description: Private order issue reporting
 */

/**
 * @swagger
 * /orders/{orderId}/issue:
 *   post:
 *     summary: Report an issue with an order
 *     tags: [Order Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order being reported
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [rating, issueType]
 *             properties:
 *               roverId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional rover linked to this order
 *               userName:
 *                 type: string
 *               userAvatarUrl:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: Only 1, 2, or 3 allowed
 *               issueType:
 *                 type: string
 *                 enum: [rover_slow, package_damaged, wrong_delivery, rover_malfunction, other]
 *               comment:
 *                 type: string
 *                 description: Optional description of the issue
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Upload via POST /uploads first, then pass URLs here
 *     responses:
 *       201:
 *         description: Issue reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Issue reported successfully
 *                 issueId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   example: open
 *       409:
 *         description: An issue for this order already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Rating is 4 or above — not a valid issue rating
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/issue",
  extractUserFromHeaders,
  upload.array("images", 5),
  ctrl.reportIssue,
);

/**
 * @swagger
 * /orders/{orderId}/issue:
 *   get:
 *     summary: Get the issue the current user submitted for an order
 *     tags: [Order Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderIssue'
 *       403:
 *         description: Forbidden — you do not own this issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No issue found for this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
router.get("/issue", extractUserFromHeaders, ctrl.getOrderIssue);

export default router;
