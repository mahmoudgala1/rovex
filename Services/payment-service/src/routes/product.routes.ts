// import { Router } from "express";
// import { ProductController } from "../controllers/product.controller";
// import { authMiddleware } from "../middleware/auth.middleware";

// const router = Router();
// const productController = new ProductController();

// // /**
// //  * @openapi
// //  * /products:
// //  *   post:
// //  *     tags:
// //  *       - Products
// //  *     summary: Create product
// //  *     description: Creates a new product in Stripe
// //  *     security:
// //  *       - bearerAuth: []
// //  *     requestBody:
// //  *       required: true
// //  *       content:
// //  *         application/json:
// //  *           schema:
// //  *             type: object
// //  *             required:
// //  *               - name
// //  *             properties:
// //  *               name:
// //  *                 type: string
// //  *                 example: Premium Plan
// //  *               description:
// //  *                 type: string
// //  *                 example: Full access to all features
// //  *               active:
// //  *                 type: boolean
// //  *                 default: true
// //  *               images:
// //  *                 type: array
// //  *                 items:
// //  *                   type: string
// //  *                 example: ["https://example.com/image.png"]
// //  *               metadata:
// //  *                 type: object
// //  *     responses:
// //  *       201:
// //  *         description: Product created
// //  */
// // router.post("/", authMiddleware, productController.createProduct);

// // /**
// //  * @openapi
// //  * /products/with-price:
// //  *   post:
// //  *     tags:
// //  *       - Products
// //  *     summary: Create product with price
// //  *     description: Creates a product and price in one request
// //  *     security:
// //  *       - bearerAuth: []
// //  *     requestBody:
// //  *       required: true
// //  *       content:
// //  *         application/json:
// //  *           schema:
// //  *             type: object
// //  *             required:
// //  *               - name
// //  *               - currency
// //  *               - unitAmount
// //  *             properties:
// //  *               name:
// //  *                 type: string
// //  *                 example: Basic Plan
// //  *               description:
// //  *                 type: string
// //  *               currency:
// //  *                 type: string
// //  *                 example: usd
// //  *               unitAmount:
// //  *                 type: integer
// //  *                 example: 999
// //  *               recurring:
// //  *                 type: object
// //  *                 properties:
// //  *                   interval:
// //  *                     type: string
// //  *                     enum: [day, week, month, year]
// //  *                     example: month
// //  *     responses:
// //  *       201:
// //  *         description: Product with price created
// //  */
// // router.post(
// //   "/with-price",
// //   authMiddleware,
// //   productController.createProductWithPrice,
// // );

// // /**
// //  * @openapi
// //  * /products/{productId}:
// //  *   get:
// //  *     tags:
// //  *       - Products
// //  *     summary: Get product
// //  *     description: Retrieves a specific product
// //  *     security:
// //  *       - bearerAuth: []
// //  *     parameters:
// //  *       - in: path
// //  *         name: productId
// //  *         required: true
// //  *         schema:
// //  *           type: string
// //  *         example: prod_xxxxx
// //  *     responses:
// //  *       200:
// //  *         description: Product retrieved
// //  */
// // router.get("/:productId", authMiddleware, productController.getProduct);

// // /**
// //  * @openapi
// //  * /products/{productId}/with-prices:
// //  *   get:
// //  *     tags:
// //  *       - Products
// //  *     summary: Get product with all prices
// //  *     description: Retrieves a product and all its associated prices
// //  *     security:
// //  *       - bearerAuth: []
// //  *     parameters:
// //  *       - in: path
// //  *         name: productId
// //  *         required: true
// //  *         schema:
// //  *           type: string
// //  *         example: prod_xxxxx
// //  *     responses:
// //  *       200:
// //  *         description: Product with prices retrieved
// //  */
// // router.get(
// //   "/:productId/with-prices",
// //   authMiddleware,
// //   productController.getProductWithPrices,
// // );

// // /**
// //  * @openapi
// //  * /products:
// //  *   get:
// //  *     tags:
// //  *       - Products
// //  *     summary: List products
// //  *     description: Lists all products with optional filters
// //  *     security:
// //  *       - bearerAuth: []
// //  *     parameters:
// //  *       - in: query
// //  *         name: active
// //  *         schema:
// //  *           type: boolean
// //  *         description: Filter by active status
// //  *       - in: query
// //  *         name: limit
// //  *         schema:
// //  *           type: integer
// //  *           default: 10
// //  *     responses:
// //  *       200:
// //  *         description: List of products
// //  */
// // router.get("/", authMiddleware, productController.listProducts);


// export default router;