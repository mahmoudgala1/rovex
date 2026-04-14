import influx from "../config/influxdb";
import { env } from "../config/environment";
import { InfluxDBClient } from "@influxdata/influxdb3-client";

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
  time?: string;
}

export const querySQL = async <T = Record<string, unknown>>(
  sql: string,
): Promise<T[]> => {
  const rows: T[] = [];

  try {
    const result = (influx as InfluxDBClient).query(sql, env.INFLUX_BUCKET!);
    for await (const row of result) {
      rows.push(row as T);
    }
  } catch (err: any) {
    if (err?.message?.includes("not found")) {
      console.warn("[InfluxDB] Table not found yet — no data written.");
      return [];
    }
    throw err;
  }

  return rows;
};

export const getLatestRoverData = async (
  roverId: string | number,
): Promise<RoverData | null> => {
  const sql = `
    SELECT *
    FROM "rover"
    WHERE time >= now() - interval '1 hour'
      AND "roverId" = '${roverId}'
    ORDER BY time DESC
    LIMIT 1
  `;

  const rows = await querySQL<any>(sql);
  if (!rows.length) return null;

  const row = rows[0];

  return {
    roverId: row.roverId,
    status: row.status,
    battery: row.battery,
    health: row.health,
    busy: row.busy,
    location: {
      lat: row.lat,
      lon: row.lon,
    },
    time: row.time,
  };
};

export const getLatestRoversData = async (): Promise<RoverData[]> => {
  const sql = `
    SELECT *
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY "roverId"
          ORDER BY time DESC
        ) AS rn
      FROM "rover"
      WHERE time >= now() - interval '1 hour'
    )
    WHERE rn = 1
  `;

  const rows = await querySQL<any>(sql);

  return rows.map((row) => ({
    roverId: row.roverId,
    status: row.status,
    battery: row.battery,
    health: row.health,
    busy: row.busy,
    location: {
      lat: row.lat,
      lon: row.lon,
    },
    time: row.time,
  }));
};

export const getRoverHistory = async (
  roverId: string | number,
  intervalHours: number = 24,
): Promise<RoverData[]> => {
  const sql = `
    SELECT *
    FROM "rovers"
    WHERE time >= now() - interval '${intervalHours} hours'
      AND roverId = '${roverId}'
    ORDER BY time ASC
  `;

  const rows = await querySQL<any>(sql);

  return rows.map((row) => ({
    roverId: row.roverId,
    status: row.status,
    battery: row.battery,
    health: row.health,
    busy: row.busy,
    location: { lat: row.lat, lon: row.lon },
    time: row.time,
  }));
};
