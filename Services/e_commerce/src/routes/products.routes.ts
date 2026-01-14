import { Router } from "express";
import * as ProductControllers from "../controllers/product.controller";
import { productIsActive } from "../middlewares/productIsActive.middleware";
import {
  extractUserFromHeaders,
  restrictTo,
} from "../middlewares/auth.middleware";
import { assignCompanyContext } from "../middlewares/assignCompanyContext.middleware";
import { upload } from "../middlewares/multer.middleware";
const router = Router();
import { MANAGEMENT_ROLES } from "../utils/permissions";
// get requests

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products for a specific company
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID used to fetch company-specific products
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number for pagination
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of products per page
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product title
 *
 *       - in: query
 *         name: price[gte]
 *         schema:
 *           type: number
 *         description: Minimum product price
 *
 *       - in: query
 *         name: price[lte]
 *         schema:
 *           type: number
 *         description: Maximum product price (use the same query structure for any property)

 *
 *     responses:
 *       200:
 *         description: All products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */

router.get(
  "/",
  extractUserFromHeaders,
  assignCompanyContext,
  ProductControllers.getAllProducts
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID for a specific company
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: company-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID used to validate product ownership
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 */

router.get(
  "/:id",
  extractUserFromHeaders,
  assignCompanyContext,
  productIsActive(false),
  ProductControllers.getProductById
);
/**
 * @swagger
 * /products/create:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             allOf:
 *               - $ref: '#/components/schemas/CreateProductInput'
 *             properties:
 *               images:
 *                 type: array
 *                 description: Product images (multiple files allowed)
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 */

router.post(
  "/create",
  extractUserFromHeaders,
  restrictTo(...MANAGEMENT_ROLES),
  upload.array("images", 5),
  ProductControllers.createProduct
);
//patch requests

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update product or soft delete it
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Product updated or deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Product'
 *                         - type: string
 *                           example: ""
 */

router.patch(
  "/update/:id",
  extractUserFromHeaders,
  restrictTo(...MANAGEMENT_ROLES),
  productIsActive(false),
  ProductControllers.updateProduct
);
//delete requests by set it not active  (soft delete)

export default router;
