import express from "express";
import rabbitmq from "./config/rabbitmq";
import consumer from "./consumers/consumer";
import { env } from "./config/environment";

const app = express();
const PORT = env.PORT;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "rovex-notification-service",
  });
});

async function startService() {
  try {
    await rabbitmq.connect();
    await consumer.start();

    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start notification service:", error);
    process.exit(1);
  }
}

const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await rabbitmq.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startService();
