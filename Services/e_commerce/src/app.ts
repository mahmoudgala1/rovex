import express, { Request, Response, Application, NextFunction } from "express";
import { LoggerMiddleware } from "./middlewares/logger.middleware";
import productRoutes from "./routers/products.routers";
import cartRoutes from "./routers/cart.routers";
import { validateRequiredFields } from "./middlewares/globalValidation.middleware";
import { AppError } from "./utils/AppError";
import { globalErrorHandeler } from "./middlewares/globalerror.middleware";
import cors from "cors";

const app: Application = express();
app.use(express.json());
app.use(cors());
app.use(LoggerMiddleware);

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
