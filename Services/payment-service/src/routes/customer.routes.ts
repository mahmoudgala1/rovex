import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const customerController = new CustomerController();

/**
 * @openapi
 * /customers:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a new customer
 *     description: Creates a new customer in Stripe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 example: Ahmed Mohamed
 *               phone:
 *                 type: string
 *                 example: +201234567890
 *               metadata:
 *                 type: object
 *                 example:
 *                   userId: user_123
 *                   plan: free
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Customer created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: cus_xxxxx
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", authMiddleware, customerController.createCustomer);

/**
 * @openapi
 * /customers/{customerId}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer by ID
 *     description: Retrieves a specific customer from Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe customer ID
 *         example: cus_xxxxx
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.get("/:customerId", authMiddleware, customerController.getCustomer);

/**
 * @openapi
 * /customers/{customerId}:
 *   put:
 *     tags:
 *       - Customers
 *     summary: Update customer
 *     description: Updates an existing customer in Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: cus_xxxxx
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put("/:customerId", authMiddleware, customerController.updateCustomer);

/**
 * @openapi
 * /customers/{customerId}:
 *   delete:
 *     tags:
 *       - Customers
 *     summary: Delete customer
 *     description: Deletes a customer from Stripe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         example: cus_xxxxx
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete(
  "/:customerId",
  authMiddleware,
  customerController.deleteCustomer,
);

/**
 * @openapi
 * /customers:
 *   get:
 *     tags:
 *       - Customers
 *     summary: List all customers
 *     description: Retrieves a paginated list of customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of customers to return
 *       - in: query
 *         name: starting_after
 *         schema:
 *           type: string
 *         description: Customer ID to start after for pagination
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get("/", authMiddleware, customerController.listCustomers);

/**
 * @openapi
 * /customers/search:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Search customers
 *     description: Search for customers using Stripe's search API
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (e.g., name:"Ahmed" or email:"user@example.com")
 *         example: name:"Ahmed"
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 */
router.get("/search", authMiddleware, customerController.searchCustomers);

export default router;
