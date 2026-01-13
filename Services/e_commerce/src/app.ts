import express, { Request, Response, Application, NextFunction } from "express";
import { LoggerMiddleware } from "./middlewares/logger.middleware";
import productRoutes from "./routes/products.routes";
import cartRoutes from "./routes/cart.routes";
import { validateRequiredFields } from "./middlewares/globalValidation.middleware";
import { AppError } from "./utils/AppError";
import { globalErrorHandeler } from "./middlewares/globalerror.middleware";
import wishlistRoutes from "./routes/whishlist.routes";
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
    service: "rovex-e_commerce-service",
  });
});

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/coupon", cartRoutes);
app.use("/api/v1/whishlist", wishlistRoutes);
app.use("/api/v1/orders", wishlistRoutes);



app.use(globalErrorHandeler);
export default app;
