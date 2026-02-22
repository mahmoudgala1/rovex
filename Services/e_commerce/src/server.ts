import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { connectDB } from "./config/db";
import rabbitmq from "./config/rabbitmq";
import consumer from "./consumers/consumer";

const port = process.env.PORT || 8001;

const startServer = async () => {
  try {
    await connectDB();
    await rabbitmq.connect();
    await consumer.start();

    const server = app.listen(port, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${port}`,
      );
    });

    const shutdown = () => {
      console.log("Shutting down server...");
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
