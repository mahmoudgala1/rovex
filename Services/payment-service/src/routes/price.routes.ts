
// import { Router } from "express";
// import { authMiddleware } from "../middleware/auth.middleware";
// import { PriceController } from "../controllers/price.controller";

// const router = Router();
// const productController = new PriceController();


// // router.post("/", authMiddleware, productController.createPrice);
// // router.get("/", authMiddleware, productController.listPrices);
// // router.get("/search", authMiddleware, productController.searchPrices);
// // router.get("/:priceId", authMiddleware, productController.getPrice);
// // router.put("/:priceId", authMiddleware, productController.updatePrice);

// /**
//  * @openapi
//  * /prices:
//  *   post:
//  *     tags:
//  *       - Prices
//  *     summary: Create price
//  *     description: Creates a new price for a product
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - productId
//  *               - currency
//  *               - unitAmount
//  *             properties:
//  *               productId:
//  *                 type: string
//  *                 example: prod_xxxxx
//  *               currency:
//  *                 type: string
//  *                 example: usd
//  *               unitAmount:
//  *                 type: integer
//  *                 example: 2999
//  *               recurring:
//  *                 type: object
//  *                 properties:
//  *                   interval:
//  *                     type: string
//  *                     enum: [day, week, month, year]
//  *                   intervalCount:
//  *                     type: integer
//  *                   trialPeriodDays:
//  *                     type: integer
//  *               nickname:
//  *                 type: string
//  *                 example: Monthly Premium
//  *     responses:
//  *       201:
//  *         description: Price created
//  */
// router.post("/", authMiddleware, productController.createPrice);

// /**
//  * @openapi
//  * /prices:
//  *   get:
//  *     tags:
//  *       - Prices
//  *     summary: List prices
//  *     description: Lists prices with optional product filter
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: productId
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: active
//  *         schema:
//  *           type: boolean
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *     responses:
//  *       200:
//  *         description: List of prices
//  */
// router.get("/", authMiddleware, productController.listPrices);

// export default router;