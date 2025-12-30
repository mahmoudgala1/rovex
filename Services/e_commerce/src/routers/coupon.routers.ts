import { Router } from "express";
import * as couponControllers from "../controllers/coupon.controller"
import { restrictTo, protect } from "../middlewares/auth.middleware";


const router = Router()

//get requests
router.get("/",protect,restrictTo("admin"),couponControllers.getAllCoupons);

// post requests
router.post("/create",protect,restrictTo("admin"), couponControllers.createCoupon);
router.post("/applyCoupon",protect, couponControllers.applyCoupon);
router.post("/removeCoupon",protect, couponControllers.removeCoupon);


//patch requests 

//update requests (soft delete)
router.patch("/:code",protect,restrictTo("admin"), couponControllers.updateCoupon);

export default router;