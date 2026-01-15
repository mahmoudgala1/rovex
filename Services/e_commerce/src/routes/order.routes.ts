import { Router } from 'express';

import * as orderController from '../controllers/order.cotroller';
import { extractUserFromHeaders, restrictTo } from '../middlewares/auth.middleware';
import { MANAGEMENT_ROLES } from '../utils/permissions';
const router = Router();
router.use(extractUserFromHeaders);

router.route('/')
    .get(orderController.GetAllOrders)
    .post(orderController.placeOrder); //tested and okay 

router.get('/:orderId', orderController.GetOrderDetails);
router.put('/cancel', orderController.cancelOrder);
router.post('/retry-payment',restrictTo("customer"), orderController.retryPayment);

export default router;