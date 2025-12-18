import app from "./app";
import { connectDB } from "./config/db";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Server running in ${process.env} mode on port ${port}`);
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
