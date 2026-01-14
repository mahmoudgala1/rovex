import { Router } from "express";
import * as couponControllers from "../controllers/coupon.controller"
import { extractUserFromHeaders, restrictTo } from "../middlewares/auth.middleware";
import { MANAGEMENT_ROLES } from "../utils/permissions";
const router = Router()

router.use(extractUserFromHeaders)
//get requests
/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons for the company
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 */

router.get("/",restrictTo(...MANAGEMENT_ROLES),couponControllers.getAllCoupons);

// post requests
/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount
 *               - expiration_date
 *               - max_usage
 *               - min_purchase_amount 
 *             properties:
 *               code:
 *                 type: string
 *                 example: SAVE20
 *               discount:
 *                 type: number
 *                 example: 20
 *               expiration_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-31
 *               max_usage:
 *                 type: number
 *                 example: 100
 *               min_purchase_amount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 */

router.post("/",restrictTo(...MANAGEMENT_ROLES), couponControllers.createCoupon);


/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     summary: Apply coupon to user's cart
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coupon_code
 *             properties:
 *               coupon_code:
 *                 type: string
 *                 example: SAVE20
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 */

router.post("/apply",restrictTo("customer"), couponControllers.applyCoupon);

/**
 * @swagger
 * /coupons/remove:
 *   delete:
 *     summary: Remove coupon from user's cart
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 */

router.post("/remove",restrictTo("customer"), couponControllers.removeCoupon);


//patch requests 

//update requests (soft delete)
/**
 * @swagger
 * /coupons/{code}:
 *   patch:
 *     summary: Update coupon (limited fields only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: SAVE20
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiration_date:
 *                 type: string
 *                 format: date
 *               max_usage:
 *                 type: number
 *               min_purchase_amount:
 *                 type: number
 *               is_deleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid updat   e fields
 */

router.patch("/:code",restrictTo(...MANAGEMENT_ROLES), couponControllers.updateCoupon);

export default router;