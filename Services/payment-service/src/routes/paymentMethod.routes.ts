import { Router } from "express";
import { PaymentMethodController } from "../controllers/paymentMethod.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const paymentMethodController = new PaymentMethodController();

/**
 * @openapi
 * /payment-methods/setup-intent:
 *   post:
 *     tags:
 *       - Payment Methods
 *     summary: Create setup intent (RECOMMENDED)
 *     description: Creates a setup intent to securely collect payment method details
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
 *               paymentMethodTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: ["card"]
 *                 example: ["card"]
 *     responses:
 *       201:
 *         description: Setup intent created
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
 *                     setupIntentId:
 *                       type: string
 *                     clientSecret:
 *                       type: string
 *                       description: Use this with Stripe Elements
 *                     status:
 *                       type: string
 */
router.post(
  "/setup-intent",
  authMiddleware,
  paymentMethodController.createSetupIntent,
);

/**
 * @openapi
 * /payment-methods/setup-intent/{setupIntentId}:
 *   get:
 *     tags:
 *       - Payment Methods
 *     summary: Get setup intent
 *     description: Retrieves a setup intent
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: setupIntentId
 *         required: true
 *         schema:
 *           type: string
 *         example: seti_xxxxx
 *     responses:
 *       200:
 *         description: Setup intent retrieved
 */
router.get(
  "/setup-intent/:setupIntentId",
  authMiddleware,
  paymentMethodController.getSetupIntent,
);

/**
 * @openapi
 * /payment-methods/customer/{customerId}:
 *   get:
 *     tags:
 *       - Payment Methods
 *     summary: List payment methods
 *     description: Lists all payment methods for a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: cus_xxxxx
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [card, us_bank_account, sepa_debit]
 *         example: card
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get(
  "/customer/:customerId",
  authMiddleware,
  paymentMethodController.listPaymentMethods,
);

/**
 * @openapi
 * /payment-methods/{paymentMethodId}:
 *   get:
 *     tags:
 *       - Payment Methods
 *     summary: Get payment method
 *     description: Retrieves a specific payment method
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         example: pm_xxxxx
 *     responses:
 *       200:
 *         description: Payment method retrieved
 */
router.get(
  "/:paymentMethodId",
  authMiddleware,
  paymentMethodController.getPaymentMethod,
);

/**
 * @openapi
 * /payment-methods/detach/{paymentMethodId}:
 *   post:
 *     tags:
 *       - Payment Methods
 *     summary: Delete payment method
 *     description: Detaches (deletes) a payment method from customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         example: pm_xxxxx
 *     responses:
 *       200:
 *         description: Payment method deleted
 */
router.post(
  "/detach/:paymentMethodId",
  authMiddleware,
  paymentMethodController.detachPaymentMethod,
);

/**
 * @openapi
 * /payment-methods/default:
 *   post:
 *     tags:
 *       - Payment Methods
 *     summary: Set default payment method
 *     description: Sets the default payment method for a customer
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
 *               - paymentMethodId
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cus_xxxxx
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_xxxxx
 *     responses:
 *       200:
 *         description: Default payment method set
 */
router.post(
  "/default",
  authMiddleware,
  paymentMethodController.setDefaultPaymentMethod,
);

/**
 * @openapi
 * /payment-methods/customer/{customerId}/default:
 *   get:
 *     tags:
 *       - Payment Methods
 *     summary: Get default payment method
 *     description: Retrieves the default payment method for a customer
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
 *         description: Default payment method retrieved
 */
router.get(
  "/customer/:customerId/default",
  authMiddleware,
  paymentMethodController.getDefaultPaymentMethod,
);

export default router;
