import { Router } from "express";
import * as ProductControllers from "../controllers/product.controller"
import { productIsActive } from "../middlewares/productIsActive.middleware";
import { extractUserFromHeaders ,restrictTo} from "../middlewares/auth.middleware";
import { assignCompanyContext } from "../middlewares/assignCompanyContext.middleware";
import { upload } from '../middlewares/multer.middleware';
const router = Router()



// get requests
router.get("/",assignCompanyContext,ProductControllers.getAllProducts);
router.get("/:id",assignCompanyContext,productIsActive,ProductControllers.getProductById);

// post requests
router.post("/create",extractUserFromHeaders,restrictTo("admin"),upload.array('images', 5),ProductControllers.createProduct); 
//patch requests 
router.patch("/update/:id",extractUserFromHeaders,restrictTo("admin"),productIsActive,ProductControllers.updateProduct)
//delete requests by set it not active  (soft delete)
export default router;