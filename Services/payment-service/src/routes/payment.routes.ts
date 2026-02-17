import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const paymentController = new PaymentController();

/**
 * @openapi
 * /payments:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment intent
 *     description: Creates a new payment intent for processing a payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount in smallest currency unit (e.g., cents for USD)
 *                 example: 100000
 *               currency:
 *                 type: string
 *                 description: Three-letter ISO currency code
 *                 example: usd
 *               description:
 *                 type: string
 *                 example: ROVEX Order #123
 *               metadata:
 *                 type: object
 *                 example:
 *                   orderId: order_123
 *                   items: "3"
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentIntentId:
 *                       type: string
 *                       example: pi_xxxxx
 *                     clientSecret:
 *                       type: string
 *                       example: pi_xxxxx_secret_xxxxx
 *                     status:
 *                       type: string
 *                       example: requires_payment_method
 *       400:
 *         description: Bad request
 */
router.post("/", authMiddleware, paymentController.createPayment);

/**
 * @openapi
 * /payments/{paymentIntentId}:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get payment intent
 *     description: Retrieves a specific payment intent
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         example: pi_xxxxx
 *     responses:
 *       200:
 *         description: Payment intent retrieved
 */
router.get("/:paymentIntentId", authMiddleware, paymentController.getPayment);

/**
 * @openapi
 * /payments/{paymentIntentId}/confirm:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Confirm payment intent
 *     description: Confirms a payment intent with a payment method
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         example: pi_xxxxx
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_xxxxx
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
router.post(
  "/:paymentIntentId/confirm",
  authMiddleware,
  paymentController.confirmPayment,
);

/**
 * @openapi
 * /payments/{paymentIntentId}/cancel:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Cancel payment intent
 *     description: Cancels a payment intent
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         example: pi_xxxxx
 *     responses:
 *       200:
 *         description: Payment cancelled
 */
router.post(
  "/:paymentIntentId/cancel",
  authMiddleware,
  paymentController.cancelPayment,
);

/**
 * @openapi
 * /payments/{paymentIntentId}/refund:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create refund
 *     description: Creates a refund for a payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         example: pi_xxxxx
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to refund (optional, full refund if not specified)
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Refund created
 */
router.post(
  "/:paymentIntentId/refund",
  authMiddleware,
  paymentController.createRefund,
);

/**
 * @openapi
 * /payments:
 *   get:
 *     tags:
 *       - Payments
 *     summary: List payment intents
 *     description: Lists payment intents with optional customer filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of payment intents
 */
router.get("/", authMiddleware, paymentController.listPayments);

export default router;
