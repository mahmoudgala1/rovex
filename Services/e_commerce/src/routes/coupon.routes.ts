import { Router } from "express";
import * as couponControllers from "../controllers/coupon.controller"
import { extractUserFromHeaders, restrictTo } from "../middlewares/auth.middleware";
import { MANAGEMENT_ROLES } from "../utils/permissions";
const router = Router()

router.use(extractUserFromHeaders)
//get requests
router.get("/",restrictTo(...MANAGEMENT_ROLES),couponControllers.getAllCoupons);

// post requests
router.post("/",restrictTo(...MANAGEMENT_ROLES), couponControllers.createCoupon);
router.post("/applyCoupon",restrictTo("customer"), couponControllers.applyCoupon);
router.post("/removeCoupon",restrictTo("customer"), couponControllers.removeCoupon);


//patch requests 

//update requests (soft delete)
router.patch("/:code",restrictTo(...MANAGEMENT_ROLES), couponControllers.updateCoupon);

export default router;