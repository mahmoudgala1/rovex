import { Router } from "express";
import customerRoutes from "./customer.routes";
import paymentRoutes from "./payment.routes";
import subscriptionRoutes from "./subscription.routes";
import paymentMethodRoutes from "./paymentMethod.routes";
import productRoutes from "./product.routes";
import priceRoutes from "./price.routes";

const router = Router();

router.use("/customers", customerRoutes);
router.use("/payments", paymentRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/products", productRoutes);
router.use("/prices", priceRoutes);

export default router;
