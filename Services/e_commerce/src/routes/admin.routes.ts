import { Router } from "express";
import * as ctrl from "../controllers/adminFeedback.controller";
import { extractUserFromHeaders } from "../middlewares/auth.middleware";
import { restrictTo } from "../middlewares/auth.middleware";

const router = Router();
const guard = [extractUserFromHeaders, restrictTo("company_admin")];

/**
 * @swagger
 * tags:
 *   name: Admin — Reviews
 *   description: Admin management of public service reviews
 */

/**
 * @swagger
 * tags:
 *   name: Admin — Issues
 *   description: Admin management of private order issues
 */

/**
 * @swagger
 * tags:
 *   name: Admin — Dashboard
 *   description: Aggregated stats for dashboard widgets
 */

// ─────────────────────────────────────────────
// SERVICE REVIEWS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/service-reviews:
 *   get:
 *     summary: Get all public reviews with full details and filters
 *     tags: [Admin — Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           enum: [4, 5]
 *         description: Filter by star value
 *       - in: query
 *         name: is_visible
 *         schema:
 *           type: boolean
 *         description: Show only visible or hidden reviews
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-01-01
 *         description: Start of date range
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-12-31
 *         description: End of date range
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServiceReview'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/service-reviews", ...guard, ctrl.getReviews);

/**
 * @swagger
 * /admin/service-reviews/stats:
 *   get:
 *     summary: Get service rating statistics for the dashboard
 *     tags: [Admin — Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated review statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   example: 4.2
 *                 totalReviews:
 *                   type: integer
 *                   example: 450
 *                 lowRatings:
 *                   type: integer
 *                   description: Count of ratings that triggered issue reports
 *                   example: 38
 *                 breakdown:
 *                   type: object
 *                   properties:
 *                     "5": { type: integer }
 *                     "4": { type: integer }
 */
router.get("/service-reviews/stats", ...guard, ctrl.getReviewStats);

/**
 * @swagger
 * /admin/service-reviews/{id}/visibility:
 *   patch:
 *     summary: Show or hide a public review
 *     tags: [Admin — Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_visible]
 *             properties:
 *               is_visible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated visibility state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 isVisible:
 *                   type: boolean
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/service-reviews/:id/visibility",
  ...guard,
  ctrl.updateVisibility,
);

// ─────────────────────────────────────────────
// ORDER ISSUES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/order-issues:
 *   get:
 *     summary: Get all private issue reports with filters
 *     tags: [Admin — Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rover_slow, package_damaged, wrong_delivery, rover_malfunction, other]
 *       - in: query
 *         name: roverId
 *         schema:
 *           type: string
 *         description: Filter issues linked to a specific rover
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: Filter by issue severity
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated issue list with open count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 open:
 *                   type: integer
 *                 issues:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderIssue'
 */
router.get("/order-issues", ...guard, ctrl.getIssues);

/**
 * @swagger
 * /admin/order-issues/{issueId}:
 *   get:
 *     summary: Get full details of a single issue report
 *     tags: [Admin — Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full issue details including rover and user info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderIssue'
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/order-issues/:issueId", ...guard, ctrl.getIssueById);

/**
 * @swagger
 * /admin/order-issues/{issueId}/status:
 *   patch:
 *     summary: Update the status of an issue (and optionally add an admin note)
 *     tags: [Admin — Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved]
 *               adminNote:
 *                 type: string
 *                 description: Optional internal note
 *                 example: Contacted user and issued refund
 *     responses:
 *       200:
 *         description: Updated issue status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: resolved
 *                 resolvedAt:
 *                   type: string
 *                   format: date-time
 *                 adminNote:
 *                   type: string
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/order-issues/:issueId/status", ...guard, ctrl.updateIssueStatus);

// ─────────────────────────────────────────────
// ROVER-SPECIFIC
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/rovers/{roverId}/issues:
 *   get:
 *     summary: Get all issue reports linked to a specific rover
 *     tags: [Admin — Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roverId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rover_slow, package_damaged, wrong_delivery, rover_malfunction, other]
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Same structure as GET /admin/order-issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 open:  { type: integer }
 *                 issues:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderIssue'
 */
router.get("/rovers/:roverId/issues", ...guard, ctrl.getRoverIssues);

/**
 * @swagger
 * /admin/rovers/{roverId}/reviews:
 *   get:
 *     summary: Get all service reviews from deliveries by a specific rover
 *     tags: [Admin — Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roverId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           enum: [4, 5]
 *       - in: query
 *         name: is_visible
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Same structure as GET /admin/service-reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServiceReview'
 */
router.get("/rovers/:roverId/reviews", ...guard, ctrl.getRoverReviews);

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/dashboard/feedback-stats:
 *   get:
 *     summary: Aggregated stats powering all dashboard widgets
 *     tags: [Admin — Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full dashboard feedback statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   example: 4.3
 *                 totalReviews:
 *                   type: integer
 *                   example: 520
 *                 totalIssues:
 *                   type: integer
 *                   example: 41
 *                 openIssues:
 *                   type: integer
 *                   example: 29
 *                 resolvedIssues:
 *                   type: integer
 *                   example: 12
 *                 mostCommonIssue:
 *                   type: string
 *                   example: rover_slow
 *                 roverMostIssues:
 *                   type: object
 *                   properties:
 *                     roverId:   { type: string }
 *                     roverName: { type: string, example: ROVEX-07 }
 *                     count:     { type: integer, example: 9 }
 *                 issueBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:  { type: string }
 *                       count: { type: integer }
 *                 ratingBreakdown:
 *                   type: object
 *                   properties:
 *                     "5": { type: integer }
 *                     "4": { type: integer }
 *                     "3": { type: integer }
 *                     "2": { type: integer }
 *                     "1": { type: integer }
 */
router.get("/dashboard/feedback-stats", ...guard, ctrl.getDashboardStats);

export default router;
