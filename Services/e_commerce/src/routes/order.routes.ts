import { Router } from 'express';

import * as orderController from '../controllers/order.controller';
import { extractUserFromHeaders, restrictTo } from '../middlewares/auth.middleware';
const router = Router();
router.use(extractUserFromHeaders);


/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [location, payment_method]
 *             properties:
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               payment_method:
 *                 type: string
 *                 enum: [Cash, Card]
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       202:
 *         description: Order placed but payment gateway unavailable
 *       400:
 *         description: Cart empty or stock/coupon error
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (filtered & paginated)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */


router.route('/')
    .get(orderController.GetAllOrders)
    .post(orderController.placeOrder); //tested and okay 

    /**
 * @swagger
 * /orders/{order_id}:
 *   get:
 *     summary: Get order details (role-based access)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */

router.get('/:order_id', orderController.GetOrderDetails); //tested and okay

/**
 * @swagger
 * /orders/{order_id}:
 *   patch:
 *     summary: Update order (role-based permissions)
 *     description: |
 *       Customer:
 *       - location only
 *
 *       Management / Fleet:
 *       - location
 *       - order_status
 *       - payment_status
 *
 *       Location update allowed only in:
 *       - Processing
 *       - Pending_Payment
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               order_status:
 *                 type: string
 *               payment_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid update
 *       404:
 *         description: Order not found or unauthorized
 */

router.patch('/:order_id', orderController.updateOrder); //tested and okay

/**
 * @swagger
 * /orders/cancel/{order_id}:
 *   post:
 *     summary: Cancel an order and restore stock
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       404:
 *         description: Order not found
 */

router.post(
  "/cancel/:order_id",
  restrictTo("customer"),
  orderController.cancelOrder,
); //tested and okay
router.post('/retry-payment',restrictTo("customer"), orderController.retryPayment); //will handle after payment service

export default router;