import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
  SUPPORT_EMAIL: string;
  RABBITMQ_URL: string;
  SMTP_FROM_NAME: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
}

export const env: Environment = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8002", 10),
  API_VERSION: process.env.API_VERSION || "v1",
  MONGODB_URI: process.env.MONGODB_URI || "",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: process.env.EMAIL_FROM || "noreply@rovex.com",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "",
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "ROVEX",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || "",
};
