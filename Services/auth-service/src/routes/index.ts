import { Router } from "express";
import authRoutes from "./auth.routes";
import fleetRoutes from "./fleet.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/fleet", fleetRoutes);
router.use("/users", userRoutes);

export default router;
