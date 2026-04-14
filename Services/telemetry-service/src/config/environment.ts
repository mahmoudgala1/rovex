import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  RABBITMQ_URL: string;
  MQTT_URL: string;
  INFLUX_URL: string;
  INFLUX_TOKEN: string;
  INFLUX_ORG: string;
  INFLUX_BUCKET: string;
}

export const env: Environment = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8004", 10),
  API_VERSION: process.env.API_VERSION || "v1",
  MONGODB_URI: process.env.MONGODB_URI || "",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "",
  MQTT_URL: process.env.MQTT_URL || "",
  INFLUX_URL: process.env.INFLUX_URL || "",
  INFLUX_TOKEN: process.env.INFLUX_TOKEN || "",
  INFLUX_ORG: process.env.INFLUX_ORG || "",
  INFLUX_BUCKET: process.env.INFLUX_BUCKET || "",
};
