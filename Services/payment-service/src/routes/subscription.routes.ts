import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const subscriptionController = new SubscriptionController();

/**
 * @openapi
 * /subscriptions/checkout:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Create checkout session
 *     description: Creates a Stripe Checkout session for subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - priceId
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_xxxxx
 *               priceId:
 *                 type: string
 *                 example: price_xxxxx
 *               trialDays:
 *                 type: integer
 *                 example: 14
 *               successUrl:
 *                 type: string
 *                 example: https://myapp.com/success
 *               cancelUrl:
 *                 type: string
 *                 example: https://myapp.com/cancel
 *     responses:
 *       201:
 *         description: Checkout session created
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
 *                     sessionId:
 *                       type: string
 *                     url:
 *                       type: string
 *                       description: Redirect user to this URL
 */
router.post("/checkout", authMiddleware, subscriptionController.createCheckout);

/**
 * @openapi
 * /subscriptions:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Create subscription
 *     description: Creates a new subscription for a customer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - priceId
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_xxxxx
 *               priceId:
 *                 type: string
 *                 example: price_xxxxx
 *               trialDays:
 *                 type: integer
 *                 example: 7
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Subscription created
 */
router.post("/", authMiddleware, subscriptionController.createSubscription);

/**
 * @openapi
 * /subscriptions/{subscriptionId}:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Get subscription
 *     description: Retrieves a specific subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         example: sub_xxxxx
 *     responses:
 *       200:
 *         description: Subscription retrieved
 */
router.get(
  "/:subscriptionId",
  authMiddleware,
  subscriptionController.getSubscription,
);

/**
 * @openapi
 * /subscriptions/{subscriptionId}:
 *   put:
 *     tags:
 *       - Subscriptions
 *     summary: Update subscription
 *     description: Updates a subscription (upgrade/downgrade)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         example: sub_xxxxx
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priceId
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: New price ID
 *                 example: price_premium_xxxxx
 *     responses:
 *       200:
 *         description: Subscription updated
 */
router.put(
  "/:subscriptionId",
  authMiddleware,
  subscriptionController.updateSubscription,
);

/**
 * @openapi
 * /subscriptions/{subscriptionId}/cancel:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Cancel subscription
 *     description: Cancels a subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         example: sub_xxxxx
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               immediately:
 *                 type: boolean
 *                 description: Cancel immediately (true) or at period end (false)
 *                 default: false
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.post(
  "/:subscriptionId/cancel",
  authMiddleware,
  subscriptionController.cancelSubscription,
);

/**
 * @openapi
 * /subscriptions/{subscriptionId}/resume:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Resume subscription
 *     description: Resumes a cancelled subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         example: sub_xxxxx
 *     responses:
 *       200:
 *         description: Subscription resumed
 */
router.post(
  "/:subscriptionId/resume",
  authMiddleware,
  subscriptionController.resumeSubscription,
);

/**
 * @openapi
 * /subscriptions:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: List subscriptions
 *     description: Lists subscriptions with optional customer filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         example: cus_xxxxx
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of subscriptions
 */
router.get("/", authMiddleware, subscriptionController.listSubscriptions);

/**
 * @openapi
 * /subscriptions/portal:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Create billing portal session
 *     description: Creates a session for Stripe Customer Portal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_xxxxx
 *               returnUrl:
 *                 type: string
 *                 example: https://myapp.com/account
 *     responses:
 *       201:
 *         description: Portal session created
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
 *                     url:
 *                       type: string
 *                       description: Redirect user to this URL
 */
router.post(
  "/portal",
  authMiddleware,
  subscriptionController.createPortalSession,
);

/**
 * @openapi
 * /subscriptions/customer/{customerId}/upcoming-invoice:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Get upcoming invoice
 *     description: Retrieves the upcoming invoice for a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: cus_xxxxx
 *     responses:
 *       200:
 *         description: Upcoming invoice
 *       404:
 *         description: No upcoming invoice found
 */
router.get(
  "/customer/:customerId/upcoming-invoice",
  authMiddleware,
  subscriptionController.getUpcomingInvoice,
);

router.get(
  "/customer/:customerId/invoices",
  authMiddleware,
  subscriptionController.listInvoices,
);
router.get(
  "/invoices/:invoiceId",
  authMiddleware,
  subscriptionController.getInvoice,
);

export default router;
