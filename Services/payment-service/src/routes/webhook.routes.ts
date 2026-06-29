import { Router } from "express";
import { stripeWebhookHandler } from "../webhooks/router";

const router = Router();

/**
 * @openapi
 * /webhooks/stripe:
 *   post:
 *     tags:
 *       - Webhooks
 *     summary: Stripe webhook endpoint
 *     description: Receives and processes webhook events from Stripe
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     received:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid webhook signature or payload
 */
router.post("/stripe", stripeWebhookHandler);

export default router;
