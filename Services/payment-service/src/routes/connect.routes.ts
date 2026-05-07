import { Router } from "express";
import { authMiddleware, restrictTo } from "../middleware/auth.middleware";
import * as connectCtrl from "../controllers/connect.controller";
import { MANAGEMENT_ROLES } from "../utils/permissions";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Stripe Connect
 *   description: Stripe Connect OAuth — Link company accounts to Stripe
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     OAuthLinkResponse:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           example: "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_xxx..."
 *           description: Stripe OAuth URL — redirect the company to this URL
 *     OnboardingLinkResponse:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           example: "https://connect.stripe.com/setup/s/xxx..."
 *           description: Stripe onboarding URL — redirect the company to complete their account setup
 *     DisconnectResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Disconnected successfully"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Company not found"
 *     AuthorizeBody:
 *       type: object
 *       required:
 *         - companyId
 *         - email
 *       properties:
 *         companyId:
 *           type: string
 *           example: "664f1b2c3d4e5f6a7b8c9d0e"
 *         name:
 *           type: string
 *           example: "Acme Corp"
 *         email:
 *           type: string
 *           format: email
 *           example: "billing@acmecorp.com"
 */

/**
 * @swagger
 * /connect/authorize:
 *   post:
 *     summary: Generate Stripe OAuth Link
 *     description: >
 *       Generates a Stripe OAuth URL for the company to connect their Stripe account.
 *       The URL contains a JWT-encoded state parameter (expires in 10 minutes) to prevent CSRF attacks.
 *       The frontend should redirect the user to the returned URL.
 *     tags: [Stripe Connect]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthorizeBody'
 *     responses:
 *       200:
 *         description: OAuth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthLinkResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "companyId and email are required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/authorize",
  authMiddleware,
  restrictTo(...MANAGEMENT_ROLES),
  connectCtrl.generateOAuthLink,
);

/**
 * @swagger
 * /connect/callback:
 *   get:
 *     summary: Handle Stripe OAuth Callback
 *     description: >
 *       Stripe redirects the company to this endpoint after they approve or deny the connection.
 *       On success, exchanges the authorization code for tokens, saves them encrypted to the database,
 *       and registers a Stripe webhook for the connected account.
 *
 *       **Note:** This endpoint always responds with a 302 redirect — not a JSON body.
 *       Do not call this endpoint directly from the frontend.
 *     tags: [Stripe Connect]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *           example: "ac_1ABC123xyz"
 *         description: Authorization code from Stripe (present on success)
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         description: JWT state token for CSRF validation
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *           enum: [access_denied]
 *           example: "access_denied"
 *         description: Error code from Stripe (present when user denies the connection)
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *           example: "The user denied your request"
 *         description: Human-readable error message from Stripe
 *     responses:
 *       302:
 *         description: >
 *           Redirects to the frontend based on outcome:
 *
 *           | Scenario | Redirect URL |
 *           |---|---|
 *           | Success | `/settings?connect=success` |
 *           | User denied | `/settings?connect=failed` |
 *           | Invalid / expired state | `/settings?connect=failed&reason=invalid_state` |
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             examples:
 *               success:
 *                 value: "https://app.yourplatform.com/settings?connect=success"
 *               failed:
 *                 value: "https://app.yourplatform.com/settings?connect=failed"
 *               invalidState:
 *                 value: "https://app.yourplatform.com/settings?connect=failed&reason=invalid_state"
 */
router.get("/callback", connectCtrl.handleCallback);

/**
 * @swagger
 * /connect/onboarding-link/refresh:
 *   get:
 *     summary: Refresh expired onboarding link
 *     description: >
 *       Stripe redirects to this endpoint automatically when the onboarding link has expired.
 *       Generates a new link and immediately redirects the company to it.
 *
 *       **Note:** This endpoint is called by Stripe directly — not by the frontend.
 *       Always responds with a 302 redirect.
 *     tags: [Stripe Connect]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "664f1b2c3d4e5f6a7b8c9d0e"
 *         description: Company ID passed as query param in the original refresh_url
 *     responses:
 *       302:
 *         description: Redirects to a newly generated Stripe onboarding link
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             example: "https://connect.stripe.com/setup/s/xxx..."
 *       400:
 *         description: Missing companyId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Company not found or no connected account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/onboarding-link/refresh", connectCtrl.refreshOnboardingLink);

/**
 * @swagger
 * /connect/{companyId}/status:
 *   get:
 *     summary: Get company Stripe connect status
 *     description: >
 *       Returns whether the company has connected their Stripe account
 *       and whether it is fully activated (charges & payouts enabled).
 *     tags: [Stripe Connect]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "664f1b2c3d4e5f6a7b8c9d0e"
 *     responses:
 *       200:
 *         description: Connect status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isConnected:
 *                   type: boolean
 *                   example: true
 *                 isFullyActivated:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   enum: [pending_connect, active, restricted, disconnected]
 *                   example: "pending_connect"
 *                 details:
 *                   type: object
 *                   properties:
 *                     accountId:
 *                       type: string
 *                       example: "acct_1TSP9pEIEOJ4Ilwq"
 *                     chargesEnabled:
 *                       type: boolean
 *                       example: false
 *                     payoutsEnabled:
 *                       type: boolean
 *                       example: false
 *                     detailsSubmitted:
 *                       type: boolean
 *                       example: false
 *                     livemode:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:companyId/status",
  authMiddleware,
  restrictTo(...MANAGEMENT_ROLES),
  connectCtrl.getConnectStatus,
);

/**
 * @swagger
 * /connect/{companyId}/onboarding-link:
 *   get:
 *     summary: Generate Stripe onboarding link
 *     description: >
 *       Generates a Stripe Account Link for the company to complete their onboarding (KYC, bank details, etc.).
 *       Only available for companies with a connected but not yet fully activated Stripe account.
 *       The link expires after a few minutes — if expired, Stripe redirects to the refresh endpoint automatically.
 *     tags: [Stripe Connect]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "664f1b2c3d4e5f6a7b8c9d0e"
 *         description: MongoDB ObjectId of the company
 *     responses:
 *       200:
 *         description: Onboarding link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OnboardingLinkResponse'
 *       400:
 *         description: No connected account or account already fully activated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noAccount:
 *                 value:
 *                   error: "Company has no connected Stripe account"
 *               alreadyActive:
 *                 value:
 *                   error: "Account is already fully activated"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:companyId/onboarding-link",
  authMiddleware,
  restrictTo(...MANAGEMENT_ROLES),
  connectCtrl.getOnboardingLink,
);

/**
 * @swagger
 * /connect/{companyId}/disconnect:
 *   delete:
 *     summary: Disconnect company Stripe account
 *     description: >
 *       Deauthorizes the connected Stripe account and clears all stored tokens from the database.
 *       After disconnecting, the company will no longer be able to accept payments
 *       until they reconnect via `/connect/authorize`.
 *     tags: [Stripe Connect]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "664f1b2c3d4e5f6a7b8c9d0e"
 *         description: MongoDB ObjectId of the company to disconnect
 *     responses:
 *       200:
 *         description: Stripe account disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisconnectResponse'
 *       400:
 *         description: Company has no connected Stripe account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No connected account found"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:companyId/disconnect",
  authMiddleware,
  restrictTo(...MANAGEMENT_ROLES),
  connectCtrl.disconnect,
);

export default router;
