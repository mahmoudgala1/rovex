import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  MONGODB_TEST_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
  SUPPORT_EMAIL: string;
  LOG_LEVEL: string;
  LOG_FILE: string;
  ALLOWED_ORIGINS: string;
  DASHBOARD_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  RABBITMQ_URL: string;
}

export const env: Environment = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8000", 10),
  API_VERSION: process.env.API_VERSION || "v1",
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/rovex_fleet",
  MONGODB_TEST_URI:
    process.env.MONGODB_TEST_URI ||
    "mongodb://localhost:27017/rovex_fleet_test",
  JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "change-me-in-production",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM: process.env.EMAIL_FROM || "noreply@rovex.com",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FILE: process.env.LOG_FILE || "logs/app.log",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
  DASHBOARD_URL: process.env.DASHBOARD_URL || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "",
};

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}
