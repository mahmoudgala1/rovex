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
 *         - company
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
 *         company:
 *           type: string
 *           example: "64b5f8c12d4a2b0000000000"
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
