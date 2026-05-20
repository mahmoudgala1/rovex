import express, { Application } from "express";
import rabbitmq from "./config/rabbitmq";
import consumer from "./consumers/consumer";
import { env } from "./config/environment";
import { connectDatabase } from "./config/database";
import fs from "fs";
import cors from "cors";
import path from "path";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";
import { errorMiddleware } from "./middleware/error.middleware";
import routes from "./routes";

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
      ? "/notification/swagger-custom.js"
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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(express.static(path.join(__dirname, "public")));
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
        service: "rovex-notification-service",
      });
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
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      await connectDatabase();
      await rabbitmq.connect();
      await consumer.start();

      const PORT = env.PORT || 8002;
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

// const push = new PushChannel();
// const data = {
//   title: "Test Notification",
//   body: "Hi there! This is a test notification from ROVEX.",
// };
// push.send(
//   "eXm5doY1RUeydvgOl46I_q:APA91bGcbHmnv7f2IuNpEFwLcvfmHtihJ3iegxk10HjUJIp678H-XjwCvewFrcUq4Uh2nComIROOjVfvHBFFd8QMTFurHr7lm-brVg_xRYEafZQu9f7vPHQ",
//   data,
// );

export default server.app;
