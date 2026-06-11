import { InfluxDBClient, Point } from "@influxdata/influxdb3-client";
import influx from "../config/influxdb";
import { env } from "../config/environment";

interface RoverData {
  roverId: string;
  status: string;
  battery: number;
  health: number;
  busy: boolean;
  location: {
    lat: number;
    lon: number;
  };
}

const BATCH_SIZE = 500;
const FLUSH_INTERVAL_MS = 3000;

let buffer: Point[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

const flushBuffer = async (): Promise<void> => {
  if (!buffer.length) return;

  const batch = buffer.splice(0, buffer.length);
  try {
    await influx.write(batch, env.INFLUX_BUCKET!);
  } catch (err) {
    console.error("[InfluxDB] Flush error:", err);
    buffer.unshift(...batch);
  }
};

const startFlushTimer = (): void => {
  if (!flushTimer) {
    flushTimer = setInterval(() => {
      flushBuffer().catch((err) =>
        console.error("[InfluxDB] Timer flush error:", err),
      );
    }, FLUSH_INTERVAL_MS);
    flushTimer.unref?.();
  }
};

const buildRoverPoint = (item: RoverData): Point => {
  return Point.measurement("rover")
    .setTag("roverId", item.roverId)
    .setStringField("status", item.status)
    .setFloatField("battery", item.battery)
    .setIntegerField("health", item.health)
    .setBooleanField("busy", item.busy)
    .setFloatField("lat", item.location.lat)
    .setFloatField("lon", item.location.lon);
};

export const writeRoverData = (item: RoverData): void => {
  try {
    buffer.push(buildRoverPoint(item));
    startFlushTimer();

    if (buffer.length >= BATCH_SIZE) {
      flushBuffer().catch((err) =>
        console.error("[InfluxDB] Auto-flush error:", err),
      );
    }
  } catch (err) {
    console.error(
      "[InfluxDB] Error building point for rover:",
      item.roverId,
      err,
    );
  }
};

export const writeRoversData = async (items: RoverData[]): Promise<void> => {
  if (!items.length) return;

  try {
    const points = items.map(buildRoverPoint);
    await (influx as InfluxDBClient).write(points, env.INFLUX_BUCKET!);
  } catch (err) {
    console.error("[InfluxDB] Batch write error:", err);
    throw err;
  }
};

export const flushInflux = async (): Promise<void> => {
  await flushBuffer();
};

const shutdown = async (signal: string): Promise<void> => {
  console.log(`[InfluxDB] Received ${signal}. Flushing and closing...`);

  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  await flushBuffer();

  try {
    (influx as InfluxDBClient).close();
    console.log("[InfluxDB] Connection closed cleanly.");
  } catch (err) {
    console.error("[InfluxDB] Error during shutdown:", err);
  }

  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
