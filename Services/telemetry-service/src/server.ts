import express, { Application } from "express";
import { env } from "./config/environment";
import { connectDatabase } from "./config/database";
import cors from "cors";
import path from "path";
import { errorMiddleware } from "./middleware/error.middleware";


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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  private configureRoutes(): void {
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "rovex-telemetry-service",
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
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      await connectDatabase();

      const PORT = env.PORT || 8004;
      this.app.listen(PORT, () => {
        console.info(`Notification service running on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

process.on("unhandledRejection", (reason: Error) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

const server = new Server();
server.start();

export default server.app;
