import { Router } from 'express';
import * as wishlistController from '../controllers/wishlist.controller';
import { extractUserFromHeaders } from '../middlewares/auth.middleware';
import { productIsActive } from '../middlewares/productIsActive.middleware';
const router = Router();

router.use(extractUserFromHeaders)

router.route('/')
    .get(wishlistController.getWishlist)
    .post(productIsActive(true),wishlistController.addToWishlist);

router.get("/ids", wishlistController.getWishlistIds);

router.delete("/", wishlistController.clearWishlist);
router.delete('/remove', wishlistController.removeFromWishlist);

export default router;