import { Router } from "express";
import { authenticateCompanyUser } from "../middleware/auth.middleware";
import {
  tenantMiddleware,
  requireTenant,
  enforceTenantIsolation,
} from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/permission.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from "../utils/validators";
import * as companyUserController from "../controllers/user.controller";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.use(authenticateCompanyUser);
router.use(tenantMiddleware);
router.use(requireTenant);
router.use(enforceTenantIsolation);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUserResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", companyUserController.getMyProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile (name and phone only)
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             name: "John Updated"
 *             phone: "+1234567890"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUserResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/me",
  validate(updateProfileSchema),
  companyUserController.updateMyProfile
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all company users
 *     description: Get a paginated list of users in the company with filtering options
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [company_admin, dispatcher, store_manager, customer_support, analyst]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email (case-insensitive)
 *         example: "john"
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUserListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.USER_VIEW),
  companyUserController.getCompanyUsers
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new company user
 *     description: Create a new user and send welcome email with temporary password
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompanyUserRequest'
 *           example:
 *             name: "John Doe"
 *             email: "john.doe@company.com"
 *             phone: "+1234567890"
 *             role: "dispatcher"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateCompanyUserResponse'
 *       400:
 *         description: Validation error or user limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailExists:
 *                 value:
 *                   success: false
 *                   message: "User with this email already exists"
 *                   error:
 *                     code: "DUPLICATE_EMAIL"
 *                     statusCode: 400
 *               limitReached:
 *                 value:
 *                   success: false
 *                   message: "Maximum user limit reached (10). Please upgrade your plan."
 *                   error:
 *                     code: "USER_LIMIT_REACHED"
 *                     statusCode: 400
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  requirePermission(PERMISSIONS.USER_CREATE),
  validate(createUserSchema),
  companyUserController.createCompanyUser
);

/**
 * @swagger
 * /users/{user_id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve detailed information about a specific user
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "USR_1234567890"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUserResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:user_id",
  requirePermission(PERMISSIONS.USER_VIEW),
  companyUserController.getCompanyUser
);

/**
 * @swagger
 * /users/{user_id}:
 *   patch:
 *     summary: Update user
 *     description: Update user information (admin only). Cannot change own role.
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "USR_1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCompanyUserRequest'
 *           example:
 *             name: "John Updated"
 *             role: "store_manager"
 *             status: "active"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUserResponse'
 *       400:
 *         description: Validation error or cannot change own role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/:user_id",
  requirePermission(PERMISSIONS.USER_EDIT),
  validate(updateUserSchema),
  companyUserController.updateCompanyUser
);

/**
 * @swagger
 * /users/{user_id}:
 *   delete:
 *     summary: Deactivate user
 *     description: Soft delete - deactivate user account. Cannot delete own account.
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "USR_1234567890"
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "User deactivated successfully"
 *               timestamp: "2025-12-16T18:15:00.000Z"
 *       400:
 *         description: Cannot delete own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:user_id",
  requirePermission(PERMISSIONS.USER_DELETE),
  companyUserController.deleteCompanyUser
);

/**
 * @swagger
 * /users/{user_id}/reactivate:
 *   post:
 *     summary: Reactivate user
 *     description: Reactivate a previously deactivated user account
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "USR_1234567890"
 *     responses:
 *       200:
 *         description: User reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyUserResponse'
 *       400:
 *         description: User limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:user_id/reactivate",
  requirePermission(PERMISSIONS.USER_EDIT),
  companyUserController.reactivateCompanyUser
);

export default router;
