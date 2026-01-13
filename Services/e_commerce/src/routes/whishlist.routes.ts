import { Router } from 'express';
import * as wishlistController from '../controllers/wishlist.controller';

const router = Router();



router.route('/')
    .get(wishlistController.getWishlist)
    .post(wishlistController.addToWishlist);

router.get("/ids", wishlistController.getWishlist);

router.post("/clear", wishlistController.clearWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

export default router;