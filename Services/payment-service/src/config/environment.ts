import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  RABBITMQ_URL: string;
  RABBITMQ_EXCHANGE: string;
  STRIPE_PUBLIC_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_WEBHOOK_SECRET_CONNECTED_ACCOUNTS: string;
  STRIPE_CLIENT_ID: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  APP_URL: string;
  ENCRYPTION_KEY: string;
}

export const env: Environment = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8003", 10),
  API_VERSION: process.env.API_VERSION || "v1",
  MONGODB_URI: process.env.MONGODB_URI || "",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "",
  RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE || "",
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_WEBHOOK_SECRET_CONNECTED_ACCOUNTS:
    process.env.STRIPE_WEBHOOK_SECRET_CONNECTED_ACCOUNTS || "",
  STRIPE_CLIENT_ID: process.env.STRIPE_CLIENT_ID || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  APP_URL: process.env.APP_URL || "",
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "",
};
