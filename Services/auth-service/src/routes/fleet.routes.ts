import { Router } from "express";
import fleetController from "../controllers/fleet.controller";
import { authenticateFleetOperator } from "../middleware/auth.middleware";
import {
  requirePermission,
  requireSuperAdmin,
} from "../middleware/permission.middleware";
import { PERMISSIONS } from "../config/permissions";

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

export default router;
