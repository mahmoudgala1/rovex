import { Router } from "express";
import * as couponControllers from "../controllers/coupon.controller"
import { restrictTo } from "../middlewares/auth.middleware";


const router = Router()

//get requests
router.get("/",restrictTo("admin"),couponControllers.getAllCoupons);

// post requests
router.post("/create",restrictTo("admin"), couponControllers.createCoupon);
router.post("/applyCoupon", couponControllers.applyCoupon);
router.post("/removeCoupon", couponControllers.removeCoupon);


//patch requests 

//update requests (soft delete)
router.patch("/:code",restrictTo("admin"), couponControllers.updateCoupon);

export default router;