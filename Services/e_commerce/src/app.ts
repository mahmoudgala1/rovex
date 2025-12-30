import express, { Request, Response, Application, NextFunction } from "express";
import { LoggerMiddleware } from "./middlewares/logger.middleware";
import productRoutes from "./routers/products.routers";
import cartRoutes from "./routers/cart.routers";
import { validateRequiredFields } from "./middlewares/globalValidation.middleware";
import { AppError } from "./utils/AppError";
import { globalErrorHandeler } from "./middlewares/globalerror.middleware";
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from './swagger';
import cors from "cors";

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(LoggerMiddleware);

const specs = swaggerJsDoc(swaggerOptions);
console.log(JSON.stringify(specs, null, 2)); 
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

app.use(globalErrorHandeler);
export default app;
