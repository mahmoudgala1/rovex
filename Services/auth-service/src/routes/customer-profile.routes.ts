import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { authenticateCustomer } from "../middleware/auth.middleware";
import * as customerProfileController from "../controllers/customerProfile.controller";
import {
  updateProfileSchema,
  updatePreferencesSchema,
  deleteAccountSchema,
} from "../utils/validators";

const router = Router();

router.use(authenticateCustomer);

/**
 * @swagger
 * /customers/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       404:
 *         description: Customer not found
 */
router.get("/", customerProfileController.getProfile);

/**
 * @swagger
 * /customers/profile:
 *   patch:
 *     summary: Update profile
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch(
  "/",
  validate(updateProfileSchema),
  customerProfileController.updateProfile
);

/**
 * @swagger
 * /customers/profile/preferences:
 *   patch:
 *     summary: Update preferences
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, ar]
 *               notifications:
 *                 type: object
 *                 properties:
 *                   sms:
 *                     type: boolean
 *                   email:
 *                     type: boolean
 *                   push:
 *                     type: boolean
 *               marketing_opt_in:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.patch(
  "/preferences",
  validate(updatePreferencesSchema),
  customerProfileController.updatePreferences
);

/**
 * @swagger
 * /customers/profile:
 *   delete:
 *     summary: Delete account
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted
 *       400:
 *         description: Incorrect password
 */
router.delete(
  "/",
  validate(deleteAccountSchema),
  customerProfileController.deleteAccount
);

export default router;
