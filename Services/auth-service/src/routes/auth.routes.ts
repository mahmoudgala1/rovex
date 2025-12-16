import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  authenticateFleetOperator,
} from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  logoutSchema,
} from "../utils/validators";

const router = Router();

router.post("/fleet/login", authController.fleetLogin);

router.post(
  "/fleet/change-password",
  authenticateFleetOperator,
  validate(changePasswordSchema),
  authController.changePasswordFleet
);

router.post(
  "/fleet/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPasswordFleet
);

router.post(
  "/fleet/reset-password",
  validate(resetPasswordSchema),
  authController.resetPasswordFleet
);

router.post(
  "/fleet/logout",
  authenticateFleetOperator,
  validate(logoutSchema),
  authController.fleetLogout
);

router.post(
  "/fleet/logout-all",
  authenticateFleetOperator,
  authController.logoutAllDevices
);

export default router;
