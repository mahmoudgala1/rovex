import { Router } from "express";
import authRoutes from "./auth.routes";
import fleetRoutes from "./fleet.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/fleet", fleetRoutes);


export default router;
