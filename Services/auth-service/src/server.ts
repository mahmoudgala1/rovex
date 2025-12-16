import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";

dotenv.config();

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware(): void {
    this.app.use(cors());

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(compression());
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


  public async start(): Promise<void> {
    try {

      const PORT = process.env.PORT || 8000;
      this.app.listen(PORT, () => {
      });
    } catch (error) {
      process.exit(1);
    }
  }
}

process.on("unhandledRejection", (reason: Error) => {
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  process.exit(1);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

const server = new Server();
server.start();

export default server.app;
