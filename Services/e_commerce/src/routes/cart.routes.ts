import { Router } from "express";
import * as cartControllers from "../controllers/cart.controller"
import { productIsActive } from "../middlewares/productIsActive.middleware";
import {  restrictTo } from "../middlewares/auth.middleware";
import { extractUserFromHeaders } from "../middlewares/auth.middleware";
const router = Router()
router.use(extractUserFromHeaders)
router.use(restrictTo("customer"))
/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       204:
 *         description: Cart found but is empty
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       description: Empty array because no cart exists
 *                       example: []
 */

//get requests  
router.get("/",cartControllers.getCart);

/**
 * @swagger
 * /cart/additem:
 *   post:
 *     summary: Add a product to the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartBody'
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'  # generic APIResponse
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'   # specific Cart data
 *       400:
 *         description: Bad request (invalid product ID or quantity)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/APIError'       # generic APIError
 *       401:
 *         description: Unauthorized (user not authenticated)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/APIError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/APIError'
 */

// post requests
router.post("/additem",productIsActive(true),cartControllers.addToCart);

//patch requests S

//delete requests (hard delete)

/**
 * @swagger
 * /cart/deleteitem/{productId}:
 *   delete:
 *     summary: Delete a specific product from the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from the cart
 *     responses:
 *       200:
 *         description: Product removed successfully from cart
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/APIError'
 */

router.delete("/deleteitem/:id",productIsActive(true,false),cartControllers.delteItemFromCart);
/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Clear all products from the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cart'
 */

router.delete("/",cartControllers.clearCart);

export default router;