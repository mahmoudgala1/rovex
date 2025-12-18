import { Router } from "express";
import * as ProductControllers from "../controllers/product.controller"
import { productIsActive } from "../middlewares/productIsActive.middleware";
const router = Router()

//get requests
router.get("/",ProductControllers.getAllProducts);
router.get("/:id",productIsActive,ProductControllers.getProductById);
// post requests
router.post("/create",ProductControllers.createProduct);

//patch requests S
router.patch("/update/:id",productIsActive,ProductControllers.updateProduct)
//delete requests by set it not active
export default router;