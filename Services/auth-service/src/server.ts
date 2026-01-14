import express, { Application } from "express";
import helmet from "helmet";
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

const swaggerOptions = {
  customCss: `
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #1f77b4 }
  `,
  customSiteTitle: "ROVEX Auth API Docs",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
  },
};

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

    if (env.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(
        morgan("combined", {
          stream: { write: (message) => logger.info(message.trim()) },
        })
      );
    }
  }

  private configureRoutes(): void {
    this.app.get("/api-docs.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, swaggerOptions)
    );

    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "rovex-auth-service",
      });
    });

    this.app.get("/validate", async (req, res) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.sendStatus(401);
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
        res.set("X-User-Id", decoded.user_id);
        res.set("X-User-Role", decoded.role);
        res.set("X-User-Type", decoded.user_type);
        if (decoded.company_id) res.set("X-Company-Id", decoded.type);
        return res.sendStatus(200);
      } catch (error) {
        return res.sendStatus(403);
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
