import mongoose from "mongoose";
import { Logger } from "../utils/logger";

const logger = new Logger("Database");

export async function connectDatabase(): Promise<void> {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/rovex_payments";

    await mongoose.connect(uri, {
      dbName: "rovex_payments",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("Connected to MongoDB");

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  } catch (error) {
    logger.error("Error closing MongoDB connection", error);
  }
}
