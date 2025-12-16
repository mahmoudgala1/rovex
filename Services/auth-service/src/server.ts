import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/environment";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware";
import { connectDatabase } from "./config/database";

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
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "rovex-auth-service",
      });
    });

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
