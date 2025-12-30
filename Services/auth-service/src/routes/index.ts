import { Router } from "express";
import authRoutes from "./auth.routes";
import fleetRoutes from "./fleet.routes";
import userRoutes from "./user.routes";
import customerAuthRoutes from "./customer.auth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/auth", customerAuthRoutes);
router.use("/fleet", fleetRoutes);
router.use("/users", userRoutes);

export default router;
