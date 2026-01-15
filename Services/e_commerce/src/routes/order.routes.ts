import { Router } from 'express';

import * as orderController from '../controllers/order.cotroller';
import { extractUserFromHeaders, restrictTo } from '../middlewares/auth.middleware';
const router = Router();
router.use(extractUserFromHeaders);

router.route('/')
    .get(orderController.GetAllOrders)
    .post(orderController.placeOrder); //tested and okay 

router.get('/:order_id', orderController.GetOrderDetails); //tested and okay
router.patch('/:order_id/cancel', restrictTo("customer"),  orderController.cancelOrder);
router.post('/retry-payment',restrictTo("customer"), orderController.retryPayment); //will handle after payment service

export default router;