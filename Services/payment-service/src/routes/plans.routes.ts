import { Router } from 'express';
import * as PlansController from '../controllers/plans.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PriceInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: price_1ABC123defGHI456
 *         amount:
 *           type: number
 *           description: Price in cents (e.g. 4900 = $49.00)
 *           example: 4900
 *         currency:
 *           type: string
 *           example: usd
 *         interval:
 *           type: string
 *           enum: [month, year]
 *           example: month
 *         nickname:
 *           type: string
 *           nullable: true
 *           example: ROVEX Basic — Monthly
 *         metadata:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           example:
 *             billing_cycle: monthly
 *             plan_key: basic
 *
 *     PlanLimits:
 *       type: object
 *       properties:
 *         rovers:
 *           type: integer
 *           example: 2
 *         ordersPerMonth:
 *           type: integer
 *           example: 300
 *         branches:
 *           type: integer
 *           example: 1
 *         apiAccess:
 *           type: boolean
 *           example: false
 *         gateways:
 *           type: array
 *           items:
 *             type: string
 *           example: [stripe]
 *         notifications:
 *           type: array
 *           items:
 *             type: string
 *           example: [email]
 *         supportSla:
 *           type: string
 *           example: community
 *
 *     Plan:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           example: prod_1ABC123defGHI456
 *         name:
 *           type: string
 *           example: ROVEX Basic
 *         description:
 *           type: string
 *           nullable: true
 *           example: For small businesses starting with autonomous rover delivery.
 *         planKey:
 *           type: string
 *           enum: [basic, professional, business]
 *           example: basic
 *         active:
 *           type: boolean
 *           example: true
 *         limits:
 *           $ref: '#/components/schemas/PlanLimits'
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Up to 2 active rovers
 *             - Up to 300 orders/month
 *             - Basic GPS real-time tracking
 *             - Stripe payment gateway
 *             - Email notifications
 *             - 1 branch
 *             - Basic analytics dashboard
 *             - Community support
 *             - 14-day free trial
 *         prices:
 *           type: object
 *           properties:
 *             monthly:
 *               nullable: true
 *               allOf:
 *                 - $ref: '#/components/schemas/PriceInfo'
 *             annual:
 *               nullable: true
 *               allOf:
 *                 - $ref: '#/components/schemas/PriceInfo'
 *
 *     PlansListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           example: 3
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Plan'
 *
 *     PlanSingleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Plan'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Failed to fetch plans
 *         error:
 *           type: string
 *           example: Stripe API error message
 */


/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: ROVEX subscription plans powered by Stripe
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all active subscription plans
 *     description: >
 *       Returns all active ROVEX subscription plans fetched from Stripe,
 *       sorted by price ascending (Basic → Professional → Business).
 *       Each plan includes its limits, features, and both monthly & annual prices.
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of all active plans
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlansListResponse'
 *       404:
 *         description: No plans found on Stripe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: No plans found
 *       500:
 *         description: Stripe API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', PlansController.getAllPlans);

/**
 * @swagger
 * /plans/{planKey}:
 *   get:
 *     summary: Get a single plan by key
 *     description: >
 *       Returns a single ROVEX subscription plan by its key.
 *       Valid keys are: basic, professional, business.
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: planKey
 *         required: true
 *         schema:
 *           type: string
 *           enum: [basic, professional, business]
 *         description: The plan key identifier
 *         example: professional
 *     responses:
 *       200:
 *         description: Plan found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlanSingleResponse'
 *       404:
 *         description: Plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Plan "basic" not found
 *       500:
 *         description: Stripe API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:planKey', PlansController.getPlanByKey);

export default router;
