import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { authenticateCustomer } from "../middleware/auth.middleware";
import * as customerProfileController from "../controllers/customerProfile.controller";
import {
  updateProfileSchema,
  updatePreferencesSchema,
  deleteAccountSchema,
  addAddressSchema,
  updateAddressSchema,
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

/**
 * @swagger
 * /customers/profile/addresses:
 *   get:
 *     summary: Get all addresses
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved
 */
router.get("/addresses", customerProfileController.getAddresses);

/**
 * @swagger
 * /customers/profile/addresses:
 *   post:
 *     summary: Add new address
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
 *               - label
 *               - address_line1
 *               - city
 *               - latitude
 *               - longitude
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Home"
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *                 default: "EG"
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               is_default:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Address added
 */
router.post(
  "/addresses",
  validate(addAddressSchema),
  customerProfileController.addAddress
);

/**
 * @swagger
 * /customers/profile/addresses/{address_id}:
 *   patch:
 *     summary: Update address
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               address_line1:
 *                 type: string
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Address not found
 */
router.patch(
  "/addresses/:address_id",
  validate(updateAddressSchema),
  customerProfileController.updateAddress
);

/**
 * @swagger
 * /customers/profile/addresses/{address_id}:
 *   delete:
 *     summary: Delete address
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted
 *       404:
 *         description: Address not found
 */
router.delete(
  "/addresses/:address_id",
  customerProfileController.deleteAddress
);

/**
 * @swagger
 * /customers/profile/addresses/{address_id}/set-default:
 *   post:
 *     summary: Set default address
 *     tags: [Customer Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default address updated
 *       404:
 *         description: Address not found
 */
router.post(
  "/addresses/:address_id/set-default",
  customerProfileController.setDefaultAddress
);

export default router;
