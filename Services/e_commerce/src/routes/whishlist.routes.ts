import { Router } from 'express';
import * as wishlistController from '../controllers/wishlist.controller';
import { extractUserFromHeaders, restrictTo } from '../middlewares/auth.middleware';
import { productIsActive } from '../middlewares/productIsActive.middleware';
const router = Router();

router.use(extractUserFromHeaders)
router.use(restrictTo("customer"))


/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Wishlist'
 */

router.route('/')

    .get(wishlistController.getWishlist)
    
    .post(productIsActive(true),wishlistController.addToWishlist);/**
 /**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Add product to user wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to add to wishlist
 *                 example: "69655405465cae4f71883653"
 *     responses:
 *       200:
 *         description: Item added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Wishlist'
 */
/**
 * @swagger
 * /wishlist/ids:
 *   get:
 *     summary: Get only product IDs in the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist IDs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WishlistIDs'
 */


router.get("/ids", wishlistController.getWishlistIds);

/**
 * @swagger
 * /wishlist:
 *   delete:
 *     summary: Clear all items from the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Wishlist'
 *             examples:
 *               cleared:
 *                 summary: Example response when wishlist is empty
 *                 value:
 *                   success: true
 *                   message: "Wishlist cleared successfully"
 *                   data:
 *                     _id: "69653abf186a01d3748e7d83"
 *                     user: "64b5f8c12345678901230000"
 *                     items: []
 *                     createdAt: "2026-01-13T01:19:49.687Z"
 *                     updatedAt: "2026-01-13T02:25:48.287Z"
 *                     __v: 0
 */

router.delete("/", wishlistController.clearWishlist);


/**
 * @swagger
 * /wishlist/remove:
 *   delete:
 *     summary: Remove product from user wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to remove from wishlist
 *                 example: "69655405465cae4f71883653"
 *     responses:
 *       200:
 *         description: Item removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Wishlist'
 */

router.delete('/remove', wishlistController.removeFromWishlist);

export default router;