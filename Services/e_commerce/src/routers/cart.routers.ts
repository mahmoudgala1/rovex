import { Router } from "express";
import * as cartControllers from "../controllers/cart.controller"
import { productIsActive } from "../middlewares/productIsActive.middleware";
import { protect, restrictTo } from "../middlewares/auth.middleware";
const router = Router()

//get requests
router.get("/",protect,cartControllers.getCart);

// post requests
router.post("/additem/:id",protect,productIsActive,cartControllers.addToCart);

//patch requests S

//delete requests (hard delete)
router.delete("/deleteitem/:id",protect,productIsActive,cartControllers.delteItemFromCart);
router.delete("/",protect,cartControllers.clearCart);

export default router;