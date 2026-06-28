import { Router } from "express";
import authRoutes from "./auth.routes";
import fleetRoutes from "./fleet.routes";
import userRoutes from "./user.routes";
import customerAuthRoutes from "./customerAuth.routes";
import customerProfileRoutes from "./customerProfile.routes";
import contactUsRoutes from "./contactUs.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/auth/customer", customerAuthRoutes);

router.use("/fleet", fleetRoutes);

router.use("/users", userRoutes);

router.use("/customers/profile", customerProfileRoutes);

router.use("/contact-us", contactUsRoutes);

export default router;
