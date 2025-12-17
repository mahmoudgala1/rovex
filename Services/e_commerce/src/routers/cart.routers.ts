import { Router } from "express";
import * as cartControllers from "../controllers/cart.controller"
import { productIsActive } from "../middlewares/productIsActive.middleware";
const router = Router()

//get requests
router.get("/", cartControllers.getCart);

// post requests
router.post("/additem/:id",productIsActive,cartControllers.addToCart);

//patch requests S

//delete requests (hard delete)
router.delete("/deleteitem/:id",productIsActive,cartControllers.delteItemFromCart);
router.delete("/",cartControllers.clearCart);

export default router;