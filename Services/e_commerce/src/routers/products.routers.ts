import { Router } from "express";
import * as ProductControllers from "../controllers/product.controller"
import { productIsActive } from "../middlewares/productIsActive.middleware";
import { protect ,restrictTo} from "../middlewares/auth.middleware";
const router = Router()

//get requests
/**
 * @openapi
 * /users:
 *   get:
 *     description: Get all users
 *     responses:
 *       200:
 *         description: Returns a list of users.
 */
router.get("/",ProductControllers.getAllProducts);
router.get("/:id",productIsActive,ProductControllers.getProductById);

// post requests
router.post("/create",protect,restrictTo("admin"),ProductControllers.createProduct);

//patch requests 
router.patch("/update/:id",protect,restrictTo("admin"),productIsActive,ProductControllers.updateProduct)
//delete requests by set it not active
export default router;