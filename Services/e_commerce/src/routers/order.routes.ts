import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as orderController from '../controllers/order.cotroller';

const router = Router();
router.use(protect);

router.route('/')
    .get(orderController.getMyOrders)
    .post(orderController.placeOrder);
router.get('/all', orderController.GetAllOrders);
router.get('/:orderId', orderController.GetOrderDetails);
router.put('/:orderId/cancel', orderController.cancelOrder);
router.post('/:orderId/retry-payment', orderController.retryPayment);

export default router;