// routes/contactUs.routes.ts
import { Router } from "express";
import {
  submitContactUs,
  getAllContactUs,
  updateContactUsStatus,
} from "../controllers/contactUs.controller";

import { authenticateFleetOperator } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact Us
 *   description: Contact Us endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SubmitContactUsBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - subject
 *         - message
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: Mahmoud Galal
 *         email:
 *           type: string
 *           format: email
 *           example: mahmoud@rovex.io
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+201012345678"
 *         subject:
 *           type: string
 *           maxLength: 200
 *           example: Issue with rover tracking
 *         message:
 *           type: string
 *           maxLength: 2000
 *           example: The rover location is not updating on the map.
 *
 *     ContactUsResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6680abc123def456ghi789
 *         name:
 *           type: string
 *           example: Mahmoud Galal
 *         email:
 *           type: string
 *           example: mahmoud@rovex.io
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+201012345678"
 *         subject:
 *           type: string
 *           example: Issue with rover tracking
 *         message:
 *           type: string
 *           example: The rover location is not updating on the map.
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-06-28T19:23:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-06-28T19:23:00.000Z"
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 50
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         totalPages:
 *           type: integer
 *           example: 3
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Name is required", "Invalid email format"]
 *
 *     NotFoundError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Contact not found
 *
 *     InternalError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Internal server error
 */

/**
 * @swagger
 * /contact-us:
 *   post:
 *     summary: Submit a contact us message
 *     tags: [Contact Us]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitContactUsBody'
 *           example:
 *             name: Mahmoud Galal
 *             email: mahmoud@rovex.io
 *             phone: "+201012345678"
 *             subject: Issue with rover tracking
 *             message: The rover location is not updating on the map.
 *     responses:
 *       201:
 *         description: Message submitted successfully
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
 *                   example: Your message has been received. We will get back to you soon.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 6680abc123def456ghi789
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-28T19:23:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalError'
 */
router.post("/", submitContactUs);

/**
 * @swagger
 * /contact-us:
 *   get:
 *     summary: Get all contact us messages (admin)
 *     tags: [Contact Us]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         required: false
 *         description: Filter by status
 *         example: pending
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         required: false
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of contact messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContactUsResponse'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalError'
 */
router.get("/", authenticateFleetOperator, getAllContactUs);

/**
 * @swagger
 * /contact-us/{id}/status:
 *   patch:
 *     summary: Update contact message status (admin)
 *     tags: [Contact Us]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact message MongoDB ObjectId
 *         example: 6680abc123def456ghi789
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
 *                 enum: [pending, reviewed, resolved]
 *                 example: reviewed
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContactUsResponse'
 *       400:
 *         description: Invalid status or ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalError'
 */
router.patch("/:id/status", authenticateFleetOperator, updateContactUsStatus);

export default router;
