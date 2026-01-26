import "./config/dotenv"
import {logger} from "./utils/logger"

import app from "./app";

const port = process.env.PORT;
 logger.info(port);

const startServer = async () => {
  try {
    const server = app.listen(port, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
    });

    const shutdown = () => {
        logger.info("Shutting down server...")
      server.close(() => {
        logger.info("HTTP server closed.")
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
