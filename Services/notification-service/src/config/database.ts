import mongoose from "mongoose";
import { env } from "./environment";
import path from "path";

export async function connectDatabase(): Promise<void> {
  try {
    const uri =
      env.MONGODB_URI || "mongodb://localhost:27017/rovex_notifications";

    await mongoose.connect(uri, {
      dbName: "rovex_notifications",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.info("Connected to MongoDB");

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.info("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection", error);
  }
}
