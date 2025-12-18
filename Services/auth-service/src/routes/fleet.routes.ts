import { Router } from "express";
import fleetController from "../controllers/fleet.controller";
import { authenticateFleetOperator } from "../middleware/auth.middleware";
import {
  requirePermission,
  requireSuperAdmin,
} from "../middleware/permission.middleware";
import { PERMISSIONS } from "../config/permissions";
import companyController from "../controllers/company.controller";
import { validate } from "../middleware/validation.middleware";
import {
  createCompanySchema,
  updateCompanySchema,
  companyStatusSchema,
  addLocationSchema,
  updateLocationSchema,
  assignRoversSchema,
  updateSettingsSchema,
} from "../utils/validators";

const router = Router();

/**
 * @swagger
 * /fleet/operators:
 *   post:
 *     summary: Create fleet operator
 *     description: Create a new fleet operator account. A temporary password will be generated and must be reset on first login. (Super Admin only)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Smith
 *                 description: Full name of the operator
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.smith@rovex.com
 *                 description: Email address (will be used for login)
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *                 description: Phone number
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, manager, dispatcher]
 *                 example: manager
 *                 description: Operator role
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["COMPANY_VIEW", "COMPANY_EDIT", "ROVER_VIEW"]
 *                 description: Array of permission codes
 *     responses:
 *       201:
 *         description: Fleet operator created successfully
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
 *                   example: Fleet operator created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       type: object
 *                       properties:
 *                         operator_id:
 *                           type: string
 *                           example: FO_001
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         role:
 *                           type: string
 *                           example: manager
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["COMPANY_VIEW", "COMPANY_EDIT", "ROVER_VIEW"]
 *                         status:
 *                           type: string
 *                           example: active
 *                     credentials:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                           description: Login email
 *                         temporary_password:
 *                           type: string
 *                           example: TempPass123!
 *                           description: Auto-generated temporary password (must be reset on first login)
 *                         reset_required:
 *                           type: boolean
 *                           example: true
 *                           description: Indicates password reset is required on first login
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *       409:
 *         description: Conflict - Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email already exists
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: DUPLICATE_EMAIL
 */
router.post(
  "/operators",
  authenticateFleetOperator,
  requireSuperAdmin,
  fleetController.createOperator
);

/**
 * @swagger
 * /fleet/operators:
 *   get:
 *     summary: Get all fleet operators
 *     description: Retrieve paginated list of all fleet operators with optional filters (Fleet Operator with FLEET_OPERATOR_VIEW permission)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, admin, manager, dispatcher]
 *         description: Filter by operator role
 *         example: manager
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by operator status
 *         example: active
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Operators retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     operators:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           operator_id:
 *                             type: string
 *                             example: FO_001
 *                           name:
 *                             type: string
 *                             example: John Smith
 *                           email:
 *                             type: string
 *                             example: john.smith@rovex.com
 *                           phone:
 *                             type: string
 *                             example: +1234567890
 *                           role:
 *                             type: string
 *                             example: manager
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["COMPANY_VIEW", "COMPANY_EDIT"]
 *                           status:
 *                             type: string
 *                             example: active
 *                           last_login:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 45
 *                           description: Total number of operators
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: Current page number
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                           description: Items per page
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                           description: Total number of pages
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid query parameter
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing FLEET_OPERATOR_VIEW permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 */
router.get(
  "/operators",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.FLEET_OPERATOR_VIEW),
  fleetController.listOperators
);

/**
 * @swagger
 * /fleet/operators/{operator_id}:
 *   get:
 *     summary: Get fleet operator by ID
 *     description: Retrieve detailed information about a specific fleet operator (Fleet Operator with FLEET_OPERATOR_VIEW permission)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operator_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique operator ID
 *         example: FO_001
 *     responses:
 *       200:
 *         description: Operator retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator_id:
 *                       type: string
 *                       example: FO_001
 *                     name:
 *                       type: string
 *                       example: John Smith
 *                     email:
 *                       type: string
 *                       example: john.smith@rovex.com
 *                     phone:
 *                       type: string
 *                       example: +1234567890
 *                     role:
 *                       type: string
 *                       example: manager
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["COMPANY_VIEW", "COMPANY_EDIT", "ROVER_VIEW"]
 *                     status:
 *                       type: string
 *                       example: active
 *                     last_login:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     created_by:
 *                       type: string
 *                       example: FO_000
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid operator ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid operator ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing FLEET_OPERATOR_VIEW permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Operator not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Fleet operator not found
 */
router.get(
  "/operators/:operator_id",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.FLEET_OPERATOR_VIEW),
  fleetController.getOperator
);

/**
 * @swagger
 * /fleet/operators/{operator_id}:
 *   put:
 *     summary: Update fleet operator
 *     description: Update fleet operator information including role and permissions. Email, status, and operator_id cannot be modified. (Super Admin only)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operator_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique operator ID
 *         example: FO_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Smith
 *                 description: Full name of the operator
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *                 description: Phone number
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, manager, dispatcher]
 *                 example: admin
 *                 description: Operator role
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["COMPANY_VIEW", "COMPANY_EDIT", "ROVER_VIEW", "ROVER_EDIT"]
 *                 description: Array of permission codes
 *     responses:
 *       200:
 *         description: Operator updated successfully
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
 *                   example: Operator updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       type: object
 *                       properties:
 *                         operator_id:
 *                           type: string
 *                           example: FO_001
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                         phone:
 *                           type: string
 *                           example: +1234567890
 *                         role:
 *                           type: string
 *                           example: admin
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["COMPANY_VIEW", "COMPANY_EDIT", "ROVER_VIEW", "ROVER_EDIT"]
 *                         status:
 *                           type: string
 *                           example: active
 *                         last_login:
 *                           type: string
 *                           format: date-time
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *       404:
 *         description: Operator not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Fleet operator not found
 */
router.put(
  "/operators/:operator_id",
  authenticateFleetOperator,
  requireSuperAdmin,
  fleetController.updateOperator
);

/**
 * @swagger
 * /fleet/operators/{operator_id}/status:
 *   patch:
 *     summary: Update fleet operator status
 *     description: Change fleet operator status (active, suspended, inactive) with optional reason (Super Admin only)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operator_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique operator ID
 *         example: FO_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, inactive]
 *                 example: suspended
 *                 description: New status for the operator
 *               reason:
 *                 type: string
 *                 example: Policy violation
 *                 description: Optional reason for status change (for audit purposes)
 *     responses:
 *       200:
 *         description: Operator status updated successfully
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
 *                   example: Operator status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       type: object
 *                       properties:
 *                         operator_id:
 *                           type: string
 *                           example: FO_001
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                         status:
 *                           type: string
 *                           example: suspended
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid status. Must be one of active, suspended, inactive
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *       404:
 *         description: Operator not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Fleet operator not found
 */
router.patch(
  "/operators/:operator_id/status",
  authenticateFleetOperator,
  requireSuperAdmin,
  fleetController.updateOperatorStatus
);

/**
 * @swagger
 * /fleet/operators/{operator_id}/activate:
 *   post:
 *     summary: Activate fleet operator
 *     description: Set fleet operator status to active (Super Admin only)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operator_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique operator ID
 *         example: FO_001
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Account verification completed
 *                 description: Optional reason for activation
 *     responses:
 *       200:
 *         description: Operator activated successfully
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
 *                   example: Operator activated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       type: object
 *                       properties:
 *                         operator_id:
 *                           type: string
 *                           example: FO_001
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                         status:
 *                           type: string
 *                           example: active
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Super Admin only
 *       404:
 *         description: Operator not found
 */
router.post(
  "/operators/:operator_id/activate",
  authenticateFleetOperator,
  requireSuperAdmin,
  fleetController.activateOperator
);

/**
 * @swagger
 * /fleet/operators/{operator_id}/suspend:
 *   post:
 *     summary: Suspend fleet operator
 *     description: Set fleet operator status to suspended (Super Admin only)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operator_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique operator ID
 *         example: FO_001
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Policy violation - under investigation
 *                 description: Optional reason for suspension
 *     responses:
 *       200:
 *         description: Operator suspended successfully
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
 *                   example: Operator suspended successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       type: object
 *                       properties:
 *                         operator_id:
 *                           type: string
 *                           example: FO_001
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                         status:
 *                           type: string
 *                           example: suspended
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Super Admin only
 *       404:
 *         description: Operator not found
 */
router.post(
  "/operators/:operator_id/suspend",
  authenticateFleetOperator,
  requireSuperAdmin,
  fleetController.suspendOperator
);

/**
 * @swagger
 * /fleet/operators/{operator_id}/deactivate:
 *   post:
 *     summary: Deactivate fleet operator
 *     description: Set fleet operator status to inactive (Super Admin only)
 *     tags: [Fleet Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operator_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique operator ID
 *         example: FO_001
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Employee resignation
 *                 description: Optional reason for deactivation
 *     responses:
 *       200:
 *         description: Operator deactivated successfully
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
 *                   example: Operator deactivated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     operator:
 *                       type: object
 *                       properties:
 *                         operator_id:
 *                           type: string
 *                           example: FO_001
 *                         name:
 *                           type: string
 *                           example: John Smith
 *                         email:
 *                           type: string
 *                           example: john.smith@rovex.com
 *                         status:
 *                           type: string
 *                           example: inactive
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Super Admin only
 *       404:
 *         description: Operator not found
 */
router.post(
  "/operators/:operator_id/deactivate",
  authenticateFleetOperator,
  requireSuperAdmin,
  fleetController.deactivateOperator
);

/**
 * @swagger
 * /fleet/companies:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company with locations, subscription plan, and admin user (Fleet Operator with COMPANY_CREATE permission only)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - business_type
 *               - contact
 *               - subscription
 *               - locations
 *               - admin_user
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Acme Logistics Inc
 *                 description: Company name
 *               business_type:
 *                 type: string
 *                 enum: [restaurant, healthcare, campus, ecommerce, logistics]
 *                 example: logistics
 *                 description: Type of business
 *               contact:
 *                 type: object
 *                 required:
 *                   - primary_contact
 *                   - email
 *                   - phone
 *                   - address
 *                 properties:
 *                   primary_contact:
 *                     type: string
 *                     example: John Smith
 *                     description: Primary contact person name
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: contact@acmelogistics.com
 *                     description: Company contact email
 *                   phone:
 *                     type: string
 *                     example: +1234567890
 *                     description: Company contact phone
 *                   address:
 *                     type: string
 *                     example: 123 Main St, City, State 12345
 *                     description: Company headquarters address
 *               subscription:
 *                 type: object
 *                 required:
 *                   - tier
 *                   - billing_cycle
 *                   - pricing
 *                 properties:
 *                   tier:
 *                     type: string
 *                     enum: [starter, professional, enterprise]
 *                     example: professional
 *                     description: Subscription tier
 *                   billing_cycle:
 *                     type: string
 *                     enum: [monthly, yearly]
 *                     example: monthly
 *                     description: Billing cycle
 *                   pricing:
 *                     type: object
 *                     required:
 *                       - base_fee
 *                       - per_delivery_fee
 *                       - included_deliveries
 *                       - overage_rate
 *                     properties:
 *                       base_fee:
 *                         type: number
 *                         minimum: 0
 *                         example: 299.99
 *                         description: Monthly base fee
 *                       per_delivery_fee:
 *                         type: number
 *                         minimum: 0
 *                         example: 2.50
 *                         description: Fee per delivery
 *                       included_deliveries:
 *                         type: number
 *                         minimum: 0
 *                         example: 500
 *                         description: Number of deliveries included in base fee
 *                       overage_rate:
 *                         type: number
 *                         minimum: 0
 *                         example: 3.00
 *                         description: Fee per delivery over included amount
 *               locations:
 *                 type: array
 *                 minItems: 1
 *                 description: Company locations (at least one required)
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - address
 *                     - coordinates
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Headquarters
 *                       description: Location name
 *                     address:
 *                       type: string
 *                       example: 123 Main St, City, State 12345
 *                       description: Location address
 *                     coordinates:
 *                       type: object
 *                       required:
 *                         - type
 *                         - coordinates
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [Point]
 *                           example: Point
 *                           description: GeoJSON type
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           minItems: 2
 *                           maxItems: 2
 *                           example: [-122.4194, 37.7749]
 *                           description: "[longitude, latitude]"
 *                     operating_hours:
 *                       type: object
 *                       description: Operating hours by day of week
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           open:
 *                             type: string
 *                             example: "09:00"
 *                             description: Opening time (HH:mm format)
 *                           close:
 *                             type: string
 *                             example: "18:00"
 *                             description: Closing time (HH:mm format)
 *                       example:
 *                         monday:
 *                           open: "09:00"
 *                           close: "18:00"
 *                         tuesday:
 *                           open: "09:00"
 *                           close: "18:00"
 *                     is_primary:
 *                       type: boolean
 *                       example: true
 *                       description: Whether this is the primary location
 *                     active:
 *                       type: boolean
 *                       example: true
 *                       description: Whether location is active
 *               assigned_rovers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ROVER_001", "ROVER_002"]
 *                 description: Array of rover IDs to assign to this company
 *               admin_user:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - phone
 *                   - role
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Jane Doe
 *                     description: Admin user full name
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: admin@acmelogistics.com
 *                     description: Admin user email (will be used for login)
 *                   phone:
 *                     type: string
 *                     example: +1234567890
 *                     description: Admin user phone number
 *                   role:
 *                     type: string
 *                     enum: [company_admin]
 *                     example: company_admin
 *                     description: Must be company_admin
 *     responses:
 *       201:
 *         description: Company created successfully
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
 *                   example: Company created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics Inc
 *                         business_type:
 *                           type: string
 *                           example: logistics
 *                         status:
 *                           type: string
 *                           example: active
 *                         contact:
 *                           type: object
 *                         subscription:
 *                           type: object
 *                         locations:
 *                           type: array
 *                           items:
 *                             type: object
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     admin_user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: CU_001
 *                         email:
 *                           type: string
 *                           example: admin@acmelogistics.com
 *                         name:
 *                           type: string
 *                           example: Jane Doe
 *                         role:
 *                           type: string
 *                           example: company_admin
 *                         temporary_password:
 *                           type: string
 *                           example: TempPass123!
 *                           description: Temporary password for first login
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: contact.email
 *                           message:
 *                             type: string
 *                             example: Must be a valid email address
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_CREATE permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       409:
 *         description: Conflict - Company name or admin email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company with this name already exists
 */
router.post(
  "/companies",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_CREATE),
  validate(createCompanySchema),
  companyController.createCompany
);

/**
 * @swagger
 * /fleet/companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve paginated list of all companies (Fleet Operator with COMPANY_VIEW permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, trial, suspended, cancelled]
 *         description: Filter by company status
 *         example: active
 *       - in: query
 *         name: business_type
 *         schema:
 *           type: string
 *           enum: [restaurant, healthcare, campus, ecommerce, logistics]
 *         description: Filter by business type
 *         example: logistics
 *       - in: query
 *         name: subscription_tier
 *         schema:
 *           type: string
 *           enum: [starter, professional, enterprise]
 *         description: Filter by subscription tier
 *         example: professional
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or contact email
 *         example: acme
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, created_at, -name, -created_at]
 *         description: Sort field (prefix with - for descending)
 *         example: -created_at
 *     responses:
 *       200:
 *         description: Companies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     companies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           company_id:
 *                             type: string
 *                             example: COMP_001
 *                           name:
 *                             type: string
 *                             example: Acme Logistics Inc
 *                           business_type:
 *                             type: string
 *                             example: logistics
 *                           status:
 *                             type: string
 *                             enum: [active, suspended, inactive]
 *                             example: active
 *                           contact:
 *                             type: object
 *                             properties:
 *                               primary_contact:
 *                                 type: string
 *                                 example: John Smith
 *                               email:
 *                                 type: string
 *                                 example: contact@acmelogistics.com
 *                               phone:
 *                                 type: string
 *                                 example: +1234567890
 *                               address:
 *                                 type: string
 *                                 example: 123 Main St, City, State 12345
 *                           subscription:
 *                             type: object
 *                             properties:
 *                               tier:
 *                                 type: string
 *                                 example: professional
 *                               billing_cycle:
 *                                 type: string
 *                                 example: monthly
 *                               status:
 *                                 type: string
 *                                 example: active
 *                               current_period_start:
 *                                 type: string
 *                                 format: date-time
 *                               current_period_end:
 *                                 type: string
 *                                 format: date-time
 *                           locations_count:
 *                             type: integer
 *                             example: 3
 *                             description: Number of locations
 *                           assigned_rovers_count:
 *                             type: integer
 *                             example: 5
 *                             description: Number of assigned rovers
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 45
 *                           description: Total number of companies
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: Current page
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                           description: Items per page
 *                         total_pages:
 *                           type: integer
 *                           example: 5
 *                           description: Total number of pages
 *                         has_next:
 *                           type: boolean
 *                           example: true
 *                           description: Whether there is a next page
 *                         has_prev:
 *                           type: boolean
 *                           example: false
 *                           description: Whether there is a previous page
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error - Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid query parameter
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_VIEW permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 */
router.get(
  "/companies",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_VIEW),
  companyController.listCompanies
);

/**
 * @swagger
 * /fleet/companies/{company_id}:
 *   get:
 *     summary: Get company by ID
 *     description: Retrieve detailed information about a specific company (Fleet Operator with COMPANY_VIEW permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     responses:
 *       200:
 *         description: Company retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics Inc
 *                         business_type:
 *                           type: string
 *                           enum: [restaurant, healthcare, campus, ecommerce, logistics]
 *                           example: logistics
 *                         status:
 *                           type: string
 *                           enum: [active, suspended, inactive]
 *                           example: active
 *                         contact:
 *                           type: object
 *                           properties:
 *                             primary_contact:
 *                               type: string
 *                               example: John Smith
 *                             email:
 *                               type: string
 *                               example: contact@acmelogistics.com
 *                             phone:
 *                               type: string
 *                               example: +1234567890
 *                             address:
 *                               type: string
 *                               example: 123 Main St, City, State 12345
 *                         subscription:
 *                           type: object
 *                           properties:
 *                             tier:
 *                               type: string
 *                               enum: [starter, professional, enterprise]
 *                               example: professional
 *                             billing_cycle:
 *                               type: string
 *                               enum: [monthly, yearly]
 *                               example: monthly
 *                             status:
 *                               type: string
 *                               enum: [active, past_due, cancelled, trial]
 *                               example: active
 *                             pricing:
 *                               type: object
 *                               properties:
 *                                 base_fee:
 *                                   type: number
 *                                   example: 299.99
 *                                 per_delivery_fee:
 *                                   type: number
 *                                   example: 2.50
 *                                 included_deliveries:
 *                                   type: number
 *                                   example: 500
 *                                 overage_rate:
 *                                   type: number
 *                                   example: 3.00
 *                             current_period_start:
 *                               type: string
 *                               format: date-time
 *                             current_period_end:
 *                               type: string
 *                               format: date-time
 *                             next_billing_date:
 *                               type: string
 *                               format: date-time
 *                         locations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               location_id:
 *                                 type: string
 *                                 example: LOC_001
 *                               name:
 *                                 type: string
 *                                 example: Headquarters
 *                               address:
 *                                 type: string
 *                                 example: 123 Main St, City, State 12345
 *                               coordinates:
 *                                 type: object
 *                                 properties:
 *                                   type:
 *                                     type: string
 *                                     example: Point
 *                                   coordinates:
 *                                     type: array
 *                                     items:
 *                                       type: number
 *                                     example: [-122.4194, 37.7749]
 *                               operating_hours:
 *                                 type: object
 *                                 additionalProperties:
 *                                   type: object
 *                                   properties:
 *                                     open:
 *                                       type: string
 *                                       example: "09:00"
 *                                     close:
 *                                       type: string
 *                                       example: "18:00"
 *                               is_primary:
 *                                 type: boolean
 *                                 example: true
 *                               active:
 *                                 type: boolean
 *                                 example: true
 *                         assigned_rovers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               rover_id:
 *                                 type: string
 *                                 example: ROVER_001
 *                               name:
 *                                 type: string
 *                                 example: Rover Alpha
 *                               status:
 *                                 type: string
 *                                 example: active
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             total_deliveries:
 *                               type: integer
 *                               example: 1250
 *                             deliveries_this_month:
 *                               type: integer
 *                               example: 89
 *                             total_users:
 *                               type: integer
 *                               example: 12
 *                             active_users:
 *                               type: integer
 *                               example: 10
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         created_by:
 *                           type: string
 *                           example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid company ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid company ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_VIEW permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: COMPANY_NOT_FOUND
 */
router.get(
  "/companies/:company_id",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_VIEW),
  companyController.getCompany
);

/**
 * @swagger
 * /fleet/companies/{company_id}:
 *   put:
 *     summary: Update company information
 *     description: Update company name and contact details (Fleet Operator with COMPANY_EDIT permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Acme Logistics International
 *                 description: Updated company name
 *               contact:
 *                 type: object
 *                 properties:
 *                   primary_contact:
 *                     type: string
 *                     example: Jane Doe
 *                     description: Updated primary contact person
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: newemail@acmelogistics.com
 *                     description: Updated contact email
 *                   phone:
 *                     type: string
 *                     example: +1987654321
 *                     description: Updated contact phone
 *                   address:
 *                     type: string
 *                     example: 456 New Address St, City, State 54321
 *                     description: Updated company address
 *     responses:
 *       200:
 *         description: Company updated successfully
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
 *                   example: Company updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics International
 *                         business_type:
 *                           type: string
 *                           example: logistics
 *                         status:
 *                           type: string
 *                           example: active
 *                         contact:
 *                           type: object
 *                           properties:
 *                             primary_contact:
 *                               type: string
 *                               example: Jane Doe
 *                             email:
 *                               type: string
 *                               example: newemail@acmelogistics.com
 *                             phone:
 *                               type: string
 *                               example: +1987654321
 *                             address:
 *                               type: string
 *                               example: 456 New Address St, City, State 54321
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         updated_by:
 *                           type: string
 *                           example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: contact.email
 *                           message:
 *                             type: string
 *                             example: Must be a valid email address
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_EDIT permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 *       409:
 *         description: Conflict - Company name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company with this name already exists
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: DUPLICATE_COMPANY_NAME
 */
router.put(
  "/companies/:company_id",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_EDIT),
  validate(updateCompanySchema),
  companyController.updateCompany
);

/**
 * @swagger
 * /fleet/companies/{company_id}/status:
 *   patch:
 *     summary: Update company status
 *     description: Change company status (active, trial, suspended, cancelled). Super Admin only.
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, trial, suspended, cancelled]
 *                 example: suspended
 *                 description: New company status
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: Payment overdue for 30 days
 *                 description: Optional reason for status change
 *     responses:
 *       200:
 *         description: Company status updated successfully
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
 *                   example: Company status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics Inc
 *                         status:
 *                           type: string
 *                           example: suspended
 *                         previous_status:
 *                           type: string
 *                           example: active
 *                         status_changed_at:
 *                           type: string
 *                           format: date-time
 *                         status_changed_by:
 *                           type: string
 *                           example: FO_001
 *                         status_reason:
 *                           type: string
 *                           example: Payment overdue for 30 days
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: status
 *                           message:
 *                             type: string
 *                             example: Status must be one of [active, trial, suspended, cancelled]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INSUFFICIENT_PERMISSIONS
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.patch(
  "/companies/:company_id/status",
  authenticateFleetOperator,
  requireSuperAdmin,
  validate(companyStatusSchema),
  companyController.updateCompanyStatus
);


/**
 * @swagger
 * /fleet/companies/{company_id}/activate:
 *   post:
 *     summary: Activate company
 *     description: Activate a suspended or cancelled company (Super Admin only)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Payment received, account restored
 *                 description: Optional reason for activation
 *     responses:
 *       200:
 *         description: Company activated successfully
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
 *                   example: Company activated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics Inc
 *                         status:
 *                           type: string
 *                           example: active
 *                         previous_status:
 *                           type: string
 *                           example: suspended
 *                         activated_at:
 *                           type: string
 *                           format: date-time
 *                         activated_by:
 *                           type: string
 *                           example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.post(
  "/companies/:company_id/activate",
  authenticateFleetOperator,
  requireSuperAdmin,
  companyController.activateCompany
);

/**
 * @swagger
 * /fleet/companies/{company_id}/suspend:
 *   post:
 *     summary: Suspend company
 *     description: Suspend an active company. Users will not be able to login or use services. (Super Admin only)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Payment overdue for 30 days
 *                 description: Optional reason for suspension
 *     responses:
 *       200:
 *         description: Company suspended successfully
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
 *                   example: Company suspended successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics Inc
 *                         status:
 *                           type: string
 *                           example: suspended
 *                         previous_status:
 *                           type: string
 *                           example: active
 *                         suspended_at:
 *                           type: string
 *                           format: date-time
 *                         suspended_by:
 *                           type: string
 *                           example: FO_001
 *                         suspension_reason:
 *                           type: string
 *                           example: Payment overdue for 30 days
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.post(
  "/companies/:company_id/suspend",
  authenticateFleetOperator,
  requireSuperAdmin,
  companyController.suspendCompany
);

/**
 * @swagger
 * /fleet/companies/{company_id}/cancel:
 *   post:
 *     summary: Cancel company subscription
 *     description: Cancel company subscription. Users will not be able to login. Company data is retained. (Super Admin only)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Customer requested cancellation
 *                 description: Optional reason for cancellation
 *     responses:
 *       200:
 *         description: Company subscription cancelled successfully
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
 *                   example: Company subscription cancelled successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Acme Logistics Inc
 *                         status:
 *                           type: string
 *                           example: cancelled
 *                         previous_status:
 *                           type: string
 *                           example: active
 *                         cancelled_at:
 *                           type: string
 *                           format: date-time
 *                         cancelled_by:
 *                           type: string
 *                           example: FO_001
 *                         cancellation_reason:
 *                           type: string
 *                           example: Customer requested cancellation
 *                         subscription:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: cancelled
 *                             cancelled_at:
 *                               type: string
 *                               format: date-time
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.post(
  "/companies/:company_id/cancel",
  authenticateFleetOperator,
  requireSuperAdmin,
  companyController.cancelCompany
);

/**
 * @swagger
 * /fleet/companies/{company_id}/locations:
 *   post:
 *     summary: Add location to company
 *     description: Add a new location to an existing company (Fleet Operator with COMPANY_EDIT permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - coordinates
 *             properties:
 *               name:
 *                 type: string
 *                 example: Downtown Branch
 *                 description: Location name
 *               address:
 *                 type: string
 *                 example: 789 Downtown St, City, State 67890
 *                 description: Full address of the location
 *               coordinates:
 *                 type: object
 *                 required:
 *                   - type
 *                   - coordinates
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: Point
 *                     description: GeoJSON type (must be "Point")
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     example: [-118.2437, 34.0522]
 *                     description: "[longitude, latitude] in decimal degrees"
 *               operating_hours:
 *                 type: object
 *                 description: Operating hours by day of week (optional)
 *                 additionalProperties:
 *                   type: object
 *                   required:
 *                     - open
 *                     - close
 *                   properties:
 *                     open:
 *                       type: string
 *                       example: "08:00"
 *                       description: Opening time in HH:mm format (24-hour)
 *                     close:
 *                       type: string
 *                       example: "20:00"
 *                       description: Closing time in HH:mm format (24-hour)
 *                 example:
 *                   monday:
 *                     open: "08:00"
 *                     close: "20:00"
 *                   tuesday:
 *                     open: "08:00"
 *                     close: "20:00"
 *                   wednesday:
 *                     open: "08:00"
 *                     close: "20:00"
 *                   thursday:
 *                     open: "08:00"
 *                     close: "20:00"
 *                   friday:
 *                     open: "08:00"
 *                     close: "20:00"
 *                   saturday:
 *                     open: "10:00"
 *                     close: "18:00"
 *                   sunday:
 *                     open: "10:00"
 *                     close: "16:00"
 *               is_primary:
 *                 type: boolean
 *                 example: false
 *                 description: Whether this is the primary location (only one primary allowed)
 *                 default: false
 *               active:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the location is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Location added successfully
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
 *                   example: Location added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: object
 *                       properties:
 *                         location_id:
 *                           type: string
 *                           example: LOC_004
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Downtown Branch
 *                         address:
 *                           type: string
 *                           example: 789 Downtown St, City, State 67890
 *                         coordinates:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: Point
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [-118.2437, 34.0522]
 *                         operating_hours:
 *                           type: object
 *                         is_primary:
 *                           type: boolean
 *                           example: false
 *                         active:
 *                           type: boolean
 *                           example: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         created_by:
 *                           type: string
 *                           example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: coordinates.coordinates
 *                           message:
 *                             type: string
 *                             example: Coordinates array must contain exactly 2 numbers [longitude, latitude]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_EDIT permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 *       409:
 *         description: Conflict - Cannot set multiple primary locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company already has a primary location. Please unset the existing primary location first.
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: PRIMARY_LOCATION_EXISTS
 */
router.post(
  "/companies/:company_id/locations",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_EDIT),
  validate(addLocationSchema),
  companyController.addLocation
);

/**
 * @swagger
 * /fleet/companies/{company_id}/locations/{location_id}:
 *   put:
 *     summary: Update company location
 *     description: Update an existing location's details (Fleet Operator with COMPANY_EDIT permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *       - in: path
 *         name: location_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *         example: LOC_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Main Headquarters (Updated)
 *                 description: Updated location name
 *               address:
 *                 type: string
 *                 example: 999 New Address Blvd, City, State 99999
 *                 description: Updated full address
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: Point
 *                     description: GeoJSON type (must be "Point")
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     example: [-122.4194, 37.7749]
 *                     description: "[longitude, latitude] in decimal degrees"
 *               operating_hours:
 *                 type: object
 *                 description: Updated operating hours by day of week
 *                 additionalProperties:
 *                   type: object
 *                   required:
 *                     - open
 *                     - close
 *                   properties:
 *                     open:
 *                       type: string
 *                       example: "07:00"
 *                       description: Opening time in HH:mm format (24-hour)
 *                     close:
 *                       type: string
 *                       example: "22:00"
 *                       description: Closing time in HH:mm format (24-hour)
 *                 example:
 *                   monday:
 *                     open: "07:00"
 *                     close: "22:00"
 *                   tuesday:
 *                     open: "07:00"
 *                     close: "22:00"
 *               is_primary:
 *                 type: boolean
 *                 example: true
 *                 description: Set as primary location (will unset other primary locations)
 *               active:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the location is active
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                   example: Location updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: object
 *                       properties:
 *                         location_id:
 *                           type: string
 *                           example: LOC_001
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         name:
 *                           type: string
 *                           example: Main Headquarters (Updated)
 *                         address:
 *                           type: string
 *                           example: 999 New Address Blvd, City, State 99999
 *                         coordinates:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: Point
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [-122.4194, 37.7749]
 *                         operating_hours:
 *                           type: object
 *                         is_primary:
 *                           type: boolean
 *                           example: true
 *                         active:
 *                           type: boolean
 *                           example: true
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         updated_by:
 *                           type: string
 *                           example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_EDIT permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company or location not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Location not found
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: LOCATION_NOT_FOUND
 */
router.put(
  "/companies/:company_id/locations/:location_id",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_EDIT),
  validate(updateLocationSchema),
  companyController.updateLocation
);

/**
 * @swagger
 * /fleet/companies/{company_id}/locations/{location_id}:
 *   delete:
 *     summary: Delete company location
 *     description: Delete a location from a company. Cannot delete the primary location if other locations exist. (Fleet Operator with COMPANY_EDIT permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *       - in: path
 *         name: location_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID to delete
 *         example: LOC_003
 *     responses:
 *       200:
 *         description: Location deleted successfully
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
 *                   example: Location deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_location_id:
 *                       type: string
 *                       example: LOC_003
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                     deleted_by:
 *                       type: string
 *                       example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Cannot delete primary location or last location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Cannot delete primary location. Please set another location as primary first.
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: CANNOT_DELETE_PRIMARY_LOCATION
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_EDIT permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company or location not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Location not found
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: LOCATION_NOT_FOUND
 *       409:
 *         description: Conflict - Cannot delete last location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Cannot delete the last location. Company must have at least one location.
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: LAST_LOCATION_CANNOT_BE_DELETED
 */
router.delete(
  "/companies/:company_id/locations/:location_id",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_EDIT),
  companyController.deleteLocation
);

/**
 * @swagger
 * /fleet/companies/{company_id}/rovers/assign:
 *   post:
 *     summary: Assign rovers to company
 *     description: Assign one or more rovers to a company for delivery operations (Fleet Operator with ROVER_DEPLOY permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rover_ids
 *             properties:
 *               rover_ids:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 example: ["ROVER_001", "ROVER_002", "ROVER_003"]
 *                 description: Array of rover IDs to assign to the company (at least 1 required)
 *     responses:
 *       200:
 *         description: Rovers assigned successfully
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
 *                   example: Rovers assigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     assigned_rovers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rover_id:
 *                             type: string
 *                             example: ROVER_001
 *                           name:
 *                             type: string
 *                             example: Rover Alpha
 *                           status:
 *                             type: string
 *                             example: assigned
 *                           assigned_at:
 *                             type: string
 *                             format: date-time
 *                     total_assigned:
 *                       type: integer
 *                       example: 3
 *                       description: Total number of rovers assigned
 *                     company_id:
 *                       type: string
 *                       example: COMP_001
 *                     assigned_by:
 *                       type: string
 *                       example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or invalid rover IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: rover_ids
 *                           message:
 *                             type: string
 *                             example: rover_ids must contain at least 1 item
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing ROVER_DEPLOY permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found or some rovers not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: One or more rovers not found
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: ROVERS_NOT_FOUND
 *                     invalid_rover_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ROVER_999"]
 *       409:
 *         description: Conflict - Rovers already assigned to another company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Some rovers are already assigned to other companies
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: ROVERS_ALREADY_ASSIGNED
 *                     conflicting_rovers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rover_id:
 *                             type: string
 *                             example: ROVER_002
 *                           assigned_to:
 *                             type: string
 *                             example: COMP_003
 */
router.post(
  "/companies/:company_id/rovers/assign",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.ROVER_DEPLOY),
  validate(assignRoversSchema),
  companyController.assignRovers
);

/**
 * @swagger
 * /fleet/companies/{company_id}/rovers/unassign:
 *   post:
 *     summary: Unassign rovers from company
 *     description: Remove one or more rovers from a company's assignment (Fleet Operator with ROVER_DEPLOY permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rover_ids
 *             properties:
 *               rover_ids:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 example: ["ROVER_001", "ROVER_002"]
 *                 description: Array of rover IDs to unassign from the company (at least 1 required)
 *     responses:
 *       200:
 *         description: Rovers unassigned successfully
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
 *                   example: Rovers unassigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     unassigned_rovers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rover_id:
 *                             type: string
 *                             example: ROVER_001
 *                           name:
 *                             type: string
 *                             example: Rover Alpha
 *                           status:
 *                             type: string
 *                             example: available
 *                           unassigned_at:
 *                             type: string
 *                             format: date-time
 *                     total_unassigned:
 *                       type: integer
 *                       example: 2
 *                       description: Total number of rovers unassigned
 *                     company_id:
 *                       type: string
 *                       example: COMP_001
 *                     unassigned_by:
 *                       type: string
 *                       example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or rovers not assigned to this company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Some rovers are not assigned to this company
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: ROVERS_NOT_ASSIGNED_TO_COMPANY
 *                     invalid_rover_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ROVER_003"]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing ROVER_DEPLOY permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found or some rovers not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: One or more rovers not found
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: ROVERS_NOT_FOUND
 *                     invalid_rover_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["ROVER_999"]
 */
router.post(
  "/companies/:company_id/rovers/unassign",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.ROVER_DEPLOY),
  validate(assignRoversSchema),
  companyController.unassignRovers
);

/**
 * @swagger
 * /fleet/companies/{company_id}/api-credentials/regenerate:
 *   post:
 *     summary: Regenerate company API credentials
 *     description: Generate new API key and secret for a company. Old credentials will be invalidated immediately. (Super Admin only)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Security breach - credentials compromised
 *                 description: Optional reason for regenerating credentials
 *     responses:
 *       200:
 *         description: API credentials regenerated successfully
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
 *                   example: API credentials regenerated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     api_credentials:
 *                       type: object
 *                       properties:
 *                         api_key:
 *                           type: string
 *                           example: pk_live_1a2b3c4d5e6f7g8h9i0j
 *                           description: New API key (public)
 *                         api_secret:
 *                           type: string
 *                           example: sk_live_9z8y7x6w5v4u3t2s1r0q
 *                           description: New API secret (private - save securely, won't be shown again)
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: When credentials were generated
 *                         expires_at:
 *                           type: string
 *                           format: date-time
 *                           description: Expiration date (if applicable)
 *                     company_id:
 *                       type: string
 *                       example: COMP_001
 *                     previous_api_key:
 *                       type: string
 *                       example: pk_live_0j9i8h7g6f5e4d3c2b1a
 *                       description: Previous API key (now invalidated)
 *                     regenerated_by:
 *                       type: string
 *                       example: FO_001
 *                     regenerated_at:
 *                       type: string
 *                       format: date-time
 *                     reason:
 *                       type: string
 *                       example: Security breach - credentials compromised
 *                 warning:
 *                   type: string
 *                   example: Save the API secret securely. It will not be shown again. Old credentials are now invalid.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Super Admin only
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Super Admin only.
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INSUFFICIENT_PERMISSIONS
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.post(
  "/companies/:company_id/api-credentials/regenerate",
  authenticateFleetOperator,
  requireSuperAdmin,
  companyController.regenerateApiCredentials
);

/**
 * @swagger
 * /fleet/companies/{company_id}/settings:
 *   patch:
 *     summary: Update company settings
 *     description: Update company operational and notification settings (Fleet Operator with COMPANY_EDIT permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               auto_dispatch:
 *                 type: boolean
 *                 example: true
 *                 description: Enable automatic dispatch of deliveries to available rovers
 *               require_otp:
 *                 type: boolean
 *                 example: true
 *                 description: Require OTP verification for delivery completion
 *               enable_face_detection:
 *                 type: boolean
 *                 example: false
 *                 description: Enable face detection for recipient verification
 *               enable_weight_check:
 *                 type: boolean
 *                 example: true
 *                 description: Enable weight verification before and after delivery
 *               default_delivery_timeout:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 120
 *                 example: 30
 *                 description: Default delivery timeout in minutes (1-120)
 *               notification_preferences:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                     description: Enable email notifications
 *                   sms:
 *                     type: boolean
 *                     example: false
 *                     description: Enable SMS notifications
 *                   webhook:
 *                     type: boolean
 *                     example: true
 *                     description: Enable webhook notifications
 *     responses:
 *       200:
 *         description: Settings updated successfully
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
 *                   example: Settings updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                       properties:
 *                         company_id:
 *                           type: string
 *                           example: COMP_001
 *                         auto_dispatch:
 *                           type: boolean
 *                           example: true
 *                         require_otp:
 *                           type: boolean
 *                           example: true
 *                         enable_face_detection:
 *                           type: boolean
 *                           example: false
 *                         enable_weight_check:
 *                           type: boolean
 *                           example: true
 *                         default_delivery_timeout:
 *                           type: number
 *                           example: 30
 *                         notification_preferences:
 *                           type: object
 *                           properties:
 *                             email:
 *                               type: boolean
 *                               example: true
 *                             sms:
 *                               type: boolean
 *                               example: false
 *                             webhook:
 *                               type: boolean
 *                               example: true
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         updated_by:
 *                           type: string
 *                           example: FO_001
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: VALIDATION_ERROR
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                             example: default_delivery_timeout
 *                           message:
 *                             type: string
 *                             example: default_delivery_timeout must be between 1 and 120
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_EDIT permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.patch(
  "/companies/:company_id/settings",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_EDIT),
  validate(updateSettingsSchema),
  companyController.updateSettings
);

/**
 * @swagger
 * /fleet/companies/{company_id}/stats:
 *   get:
 *     summary: Get company statistics
 *     description: Retrieve comprehensive statistics for a company including deliveries, performance metrics, users, and rovers (Fleet Operator with COMPANY_VIEW permission)
 *     tags: [Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *         example: COMP_001
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total_deliveries:
 *                           type: integer
 *                           example: 1250
 *                           description: Total number of deliveries
 *                         successful_deliveries:
 *                           type: integer
 *                           example: 1180
 *                           description: Number of successful deliveries
 *                         failed_deliveries:
 *                           type: integer
 *                           example: 70
 *                           description: Number of failed deliveries
 *                         average_delivery_time:
 *                           type: number
 *                           example: 18.5
 *                           description: Average delivery time in minutes
 *                         customer_satisfaction:
 *                           type: number
 *                           example: 4.7
 *                           description: Average customer satisfaction rating (1-5)
 *                         success_rate:
 *                           type: integer
 *                           example: 94
 *                           description: Success rate percentage (rounded)
 *                         failure_rate:
 *                           type: integer
 *                           example: 6
 *                           description: Failure rate percentage (rounded)
 *                         active_users:
 *                           type: integer
 *                           example: 10
 *                           description: Number of active users
 *                         monthly_deliveries:
 *                           type: integer
 *                           example: 89
 *                           description: Number of deliveries this month
 *                         active_locations:
 *                           type: integer
 *                           example: 3
 *                           description: Number of active locations
 *                         total_locations:
 *                           type: integer
 *                           example: 3
 *                           description: Total number of locations
 *                         assigned_rovers:
 *                           type: integer
 *                           example: 5
 *                           description: Number of assigned rovers
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Missing COMPANY_VIEW permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: You do not have permission to perform this action
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Company not found
 */
router.get(
  "/companies/:company_id/stats",
  authenticateFleetOperator,
  requirePermission(PERMISSIONS.COMPANY_VIEW),
  companyController.getCompanyStats
);

export default router;
