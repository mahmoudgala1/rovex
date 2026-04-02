import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/environment";
import { logger } from "./utils/logger";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.middleware";
import { connectDatabase } from "./config/database";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import jwt from "jsonwebtoken";
import { JWTPayload } from "types";
import rabbitmq from "./config/rabbitmq";
import { AppError } from "./utils/errors";
import { startGrpcServer } from "./grpc/server";
import fs from "fs";
import path from "path";

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
  customSiteTitle: "ROVEX Auth API Docs",
  customJs:
    env.NODE_ENV !== "development"
      ? "/auth/swagger-custom.js"
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

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(compression());
    this.app.use(express.static(path.join(__dirname, "public")));

    if (env.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(
        morgan("combined", {
          stream: { write: (message) => logger.info(message.trim()) },
        }),
      );
    }
  }

  private configureRoutes(): void {
    this.app.get("/api-docs.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(isDevelopment ? swaggerSpec : swaggerDocument);
    });

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(
        isDevelopment ? swaggerSpec : swaggerDocument,
        swaggerOptions,
      ),
    );

    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "rovex-auth-service",
      });
    });

    this.app.post("/dashboard-login", async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({
            success: false,
            message: "Username and password are required",
          });
        }
        if (
          username !== env.DASHBOARD_USERNAME ||
          password !== env.DASHBOARD_PASSWORD
        ) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }
        return res.status(200).json({
          success: true,
          message: "Login successful",
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    });

    this.app.get("/validate", async (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token)
        return next(
          new AppError("Access token is required", 401, "AUTH_TOKEN_REQUIRED"),
        );

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
        res.set("X-User-Id", decoded.user_id);
        res.set("X-User-Role", decoded.role);
        res.set("X-User-Type", decoded.user_type);
        if (decoded.company_id) res.set("X-Company-Id", decoded.company_id);
        return res.sendStatus(200);
      } catch (error: any) {
        if (error.name === "TokenExpiredError") {
          return next(
            new AppError("Token has expired", 401, "AUTH_TOKEN_EXPIRED"),
          );
        } else if (error.name === "JsonWebTokenError") {
          return next(new AppError("Invalid token", 401, "AUTH_INVALID_TOKEN"));
        } else {
          return next(error);
        }
      }
    });

    this.app.use(`/api/${env.API_VERSION}`, routes);

    this.app.use("*", (req, res) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
        path: req.originalUrl,
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await connectDatabase();
      await rabbitmq.connect();
      startGrpcServer();

      const PORT = process.env.PORT || 8000;
      this.app.listen(PORT, () => {
        logger.info(`ROVEX Fleet Platform running on port ${PORT}`);
        logger.info(`Environment: ${env.NODE_ENV}`);
        logger.info(`API Version: ${env.API_VERSION}`);
      });
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

process.on("unhandledRejection", (reason: Error) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

const server = new Server();
server.start();

export default server.app;
