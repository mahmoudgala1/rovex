/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - price
 *         - stock
 *         - description
 *         - images_URL
 * 
 *       properties:
 *         _id:
 *           type: string
 *           example: "64b5f8c12d4a2b1234567890"
 *         title:
 *           type: string
 *           example: "Sony WH-1000XM5"
 *         price:
 *           type: number
 *           example: 350
 *         description:
 *           type: string
 *           example: "Wireless noise canceling headphones"
 *         stock:
 *           type: number
 *           example: 20
 *         discount:
 *           type: number
 *           description: Percentage discount on the product
 *           example: 10
 *         images_URL:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "https://res.cloudinary.com/demo/image/upload/v1/product1.jpg"
 * 
 *         is_active:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - title
 *         - price
 *         - stock
 *         - description
 *       properties:
 *         title:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         stock:
 *           type: number
 *         discount:
 *           type: number
 *
 *     UpdateProductInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         stock:
 *           type: number
 *         is_active:
 *           type: boolean
 *
 *     APIResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           nullable: true
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       properties:
 *         productId:
 *           $ref: '#/components/schemas/Product'
 *
 *     Wishlist:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "69653abf186a01d3748e7d83"
 *         user:
 *           type: string
 *           example: "64b5f8c12345678901230000"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     WishlistIDs:
 *       type: array
 *       items:
 *         type: string
 *         example: "69655405465cae4f71883653"
 */


// cart schemas
/**
 * @swagger
 * components:
 *   schemas:
 *     AddToCartBody:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: ID of the product to add
 *           example: "6965444f8546e5e0adc05995"
 *         quantity:
 *           type: integer
 *           description: Quantity of the product to add (optional, defaults to 1)
 *           example: 3
 *       required:
 *         - product
 * 
 *     CartItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         product:
 *           type: string
 *         quantity:
 *           type: integer
 *         price:
 *           type: number
 *           format: float
 * 
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         cartItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalCartPrice:
 *           type: number
 *           format: float
 *         user:
 *           type: string
 *         coupon_id:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         __v:
 *           type: integer
 */
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
