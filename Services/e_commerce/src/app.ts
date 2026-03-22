import express, { Request, Response, Application, NextFunction } from "express";
import { LoggerMiddleware } from "./middlewares/logger.middleware";
import productRoutes from "./routes/products.routes";
import cartRoutes from "./routes/cart.routes";
import couponRoutes from "./routes/coupon.routes";
import { globalErrorHandeler } from "./middlewares/globalerror.middleware";
import wishlistRoutes from "./routes/whishlist.routes";
import orderRoutes from "./routes/order.routes";
import serviceReviewRoutes from "./routes/serviceReview.routes";
import orderIssueRoutes from "./routes/orderIssue.routes";
import adminRoutes from "./routes/admin.routes";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger";
import cors from "cors";
import path from "path";
import fs from "fs";

const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar {
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 999;
    }

    .btn-back-dashboard {
      padding: 8px 16px;
      background: linear-gradient(135deg, #2da44e, #3fb950);
      color: #ffffff;
      border: 1px solid #2da44e;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.25s ease;
      text-decoration: none;
      box-shadow: 0 2px 6px rgba(45, 164, 78, 0.35);
    }

    .btn-back-dashboard:hover {
      background: linear-gradient(135deg, #238636, #2ea043);
      box-shadow: 0 4px 12px rgba(45, 164, 78, 0.45);
      transform: translateY(-1px);
    }
  
    @media (max-width: 768px) {
      .custom-nav {
        flex-direction: column;
        gap: 10px;
      }
    }
  `,
  customSiteTitle: "ROVEX Ecommerce API Docs",
  customJs:
    process.env.NODE_ENV !== "development"
      ? "/ecommerce/swagger-custom.js"
      : "/swagger-custom.js",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
  },
};

const isDevelopment = process.env.NODE_ENV !== "production";
let swaggerDocument: any;
const swaggerPath = path.join(process.cwd(), "swagger.json");
if (fs.existsSync(swaggerPath)) {
  swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
} else {
  console.warn('⚠️ swagger.json not found! Run "npm run build:swagger" first.');
}

const app: Application = express();
app.use(cors());
app.use(express.json());
app.use(LoggerMiddleware);
app.use(express.static(path.join(__dirname, "public")));

const specs = swaggerJsDoc(swaggerSpec);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(isDevelopment ? specs : swaggerDocument, swaggerOptions),
);

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
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/service-reviews", serviceReviewRoutes);
app.use("/api/v1/orders/:orderId", orderIssueRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(globalErrorHandeler);
export default app;
