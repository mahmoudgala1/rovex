import { Router } from "express";
import customerRoutes from "./customer.routes";
import paymentRoutes from "./payment.routes";
import subscriptionRoutes from "./subscription.routes";
import paymentMethodRoutes from "./paymentMethod.routes";
import productRoutes from "./product.routes";
import priceRoutes from "./price.routes";
import webhookRoutes from "./webhook.routes";
import connectRoutes from "./connect.routes";

const router = Router();

router.use("/customers", customerRoutes);
router.use("/payments", paymentRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/products", productRoutes);
router.use("/prices", priceRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/connect", connectRoutes);


export default router;
