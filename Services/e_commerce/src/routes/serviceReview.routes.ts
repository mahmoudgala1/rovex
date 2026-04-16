import { Router } from "express";
import * as ctrl from "../controllers/serviceReview.controller";
import { extractUserFromHeaders, restrictTo } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Service Reviews
 *   description: Public service review endpoints
 */

/**
 * @swagger
 * /service-reviews:
 *   post:
 *     summary: Submit a public service review
 *     tags: [Service Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               userName:
 *                 type: string
 *               userAvatarUrl:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 enum: [4, 5]
 *                 description: Only 4 or 5 allowed
 *               comment:
 *                 type: string
 *                 description: Optional feedback text
 *               roverId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional rover linked to this order
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Review submitted successfully
 *       409:
 *         description: A review for this order already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Rating is less than 4
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized — missing or invalid token
 */
router.post("/", extractUserFromHeaders, restrictTo("customer"), ctrl.createReview);

/**
 * @swagger
 * /service-reviews:
 *   get:
 *     summary: Get all public reviews (shown in app)
 *     tags: [Service Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated public reviews with average rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   example: 4.4
 *                 totalReviews:
 *                   type: integer
 *                   example: 215
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userName:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       comment:
 *                         type: string
 */
router.get("/", ctrl.getReviews);

/**
 * @swagger
 * /service-reviews/stats:
 *   get:
 *     summary: Get quick rating stats for the in-app widget
 *     tags: [Service Reviews]
 *     responses:
 *       200:
 *         description: Average rating and total review count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   example: 4.3
 *                 totalReviews:
 *                   type: integer
 *                   example: 300
 */
router.get("/stats", ctrl.getStats);

export default router;
