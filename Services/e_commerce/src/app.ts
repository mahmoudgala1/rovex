import express, { Request, Response, Application, NextFunction } from "express";
import { LoggerMiddleware } from "./middlewares/logger.middleware";
import productRoutes from "./routes/products.routes";
import cartRoutes from "./routes/cart.routes";
import couponRoutes from "./routes/coupon.routes"
import { globalErrorHandeler } from "./middlewares/globalerror.middleware";
import wishlistRoutes from "./routes/whishlist.routes";
import orderRoutes from "./routes/order.routes"
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from './swagger/swagger';
import cors from "cors";

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(LoggerMiddleware);

const specs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "rovex-ecommerce-service",
  });
});

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/coupon", couponRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/orders", orderRoutes);



app.use(globalErrorHandeler);
export default app;
