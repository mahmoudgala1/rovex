import { Router } from "express";
import * as couponControllers from "../controllers/coupon.controller"


const router = Router()

//get requests

// post requests
router.post("/create", couponControllers.createCoupon);


//patch requests S

//update requests (soft delete)
router.patch("/:code", couponControllers.updateCoupon);

export default router;