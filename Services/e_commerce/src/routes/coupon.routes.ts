import { Router } from "express";
import * as couponControllers from "../controllers/coupon.controller"
import { extractUserFromHeaders, restrictTo } from "../middlewares/auth.middleware";


const router = Router()

router.use(extractUserFromHeaders)
//get requests
router.get("/",restrictTo("admin"),couponControllers.getAllCoupons);

// post requests
router.post("/",restrictTo("admin"), couponControllers.createCoupon);
router.post("/applyCoupon",restrictTo("customer"), couponControllers.applyCoupon);
router.post("/removeCoupon",restrictTo("customer"), couponControllers.removeCoupon);


//patch requests 

//update requests (soft delete)
router.patch("/:code",restrictTo("admin"), couponControllers.updateCoupon);

export default router;