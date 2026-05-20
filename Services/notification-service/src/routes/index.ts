import { Router } from "express";
import fcmTokenRoutes from "./fcmToken.routes";
import notificationRoutes from "./notification.routes";
const router = Router();

router.use("/fcm-tokens", fcmTokenRoutes);
router.use("/notifications", notificationRoutes);

export default router;
