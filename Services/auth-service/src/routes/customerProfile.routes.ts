import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { authenticateCustomer } from "../middleware/auth.middleware";
import * as customerProfileController from "../controllers/customerProfile.controller";
import {
  updateProfileSchema,
  updatePreferencesSchema,
  deleteAccountSchema,
} from "../utils/validators";
import { upload } from "../middleware/multer";

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
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer name
 *               phone:
 *                 type: string
 *                 description: Customer phone number
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (jpg, png, webp)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         customer_id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         avatar_url:
 *                           type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/",
  upload.single("avatar"),
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
