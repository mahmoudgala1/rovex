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
  time?: string;
}

export interface RoverBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface AvgBatteryRow {
  roverId: string;
  avgBattery: number;
}

export interface StatusCountRow {
  status: string;
  roverCount: number;
}

type QueryScalar = string | number | boolean;

const querySQL = async <T = Record<string, QueryScalar>>(
  sql: string,
): Promise<T[]> => {
  const rows: T[] = [];

  try {
    const result = influx.query(sql, env.INFLUX_BUCKET!);
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

const escapeString = (value: string): string => {
  return value.replace(/'/g, "''");
};

const formatInterval = (value: string): string => {
  return value;
};

const mapRoverRow = (row: any): RoverData => {
  return {
    time: String(row.time),
    roverId: String(row.roverId ?? row["roverId"]),
    status: String(row.status),
    battery: Number(row.battery),
    health: Number(row.health),
    busy: Boolean(row.busy),
    location: {
      lat: Number(row.lat),
      lon: Number(row.lon),
    },
  };
};

export const getLatestRoverRecord = async (
  roverId: string,
  interval = "1 hour",
): Promise<RoverData | null> => {
  const sql = `
      SELECT
        time,
        "roverId",
        status,
        battery,
        health,
        busy,
        lat,
        lon
      FROM rover
      WHERE "roverId" = '${escapeString(roverId)}'
        AND time >= now() - INTERVAL '${formatInterval(interval)}'
      ORDER BY time DESC
      LIMIT 1;
    `;

  const rows = await querySQL<any>(sql);

  if (!rows.length) return null;

  return mapRoverRow(rows[0]);
};

export const getLatestRecordsForAllRovers = async (
  interval = "1 hour",
): Promise<RoverData[]> => {
  const sql = `
      SELECT *
      FROM (
        SELECT
          time,
          "roverId",
          status,
          battery,
          health,
          busy,
          lat,
          lon,
          ROW_NUMBER() OVER (PARTITION BY "roverId" ORDER BY time DESC) AS rn
        FROM rover
        WHERE time >= now() - INTERVAL '${formatInterval(interval)}'
      )
      WHERE rn = 1
      ORDER BY time DESC;
    `;

  const rows = await querySQL<any>(sql);
  return rows.map((row) => mapRoverRow(row));
};

export const getLowBatteryRovers = async (
  threshold = 20,
  interval = "1 hour",
): Promise<RoverData[]> => {
  const sql = `
      SELECT
        time,
        "roverId",
        status,
        battery,
        health,
        busy,
        lat,
        lon
      FROM rover
      WHERE battery < ${threshold}
        AND time >= now() - INTERVAL '${formatInterval(interval)}'
      ORDER BY time DESC;
    `;

  const rows = await querySQL<any>(sql);
  return rows.map((row) => mapRoverRow(row));
};

export const getBusyRovers = async (
  interval = "1 hour",
): Promise<RoverData[]> => {
  const sql = `
      SELECT
        time,
        "roverId",
        status,
        battery,
        health,
        busy,
        lat,
        lon
      FROM rover
      WHERE busy = true
        AND time >= now() - INTERVAL '${formatInterval(interval)}'
      ORDER BY time DESC;
    `;

  const rows = await querySQL<any>(sql);
  return rows.map((row) => mapRoverRow(row));
};

export const getRoversInBounds = async (
  bounds: RoverBounds,
  interval = "1 hour",
): Promise<RoverData[]> => {
  const sql = `
      SELECT
        time,
        "roverId",
        status,
        battery,
        health,
        busy,
        lat,
        lon
      FROM rover
      WHERE lat BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND lon BETWEEN ${bounds.minLon} AND ${bounds.maxLon}
        AND time >= now() - INTERVAL '${formatInterval(interval)}'
      ORDER BY time DESC;
    `;

  const rows = await querySQL<any>(sql);
  return rows.map((row) => mapRoverRow(row));
};

export const getAverageBatteryPerRover = async (
  interval = "1 hour",
): Promise<AvgBatteryRow[]> => {
  const sql = `
    SELECT
      "roverId",
      AVG(battery) AS avgBattery
    FROM rover
      WHERE time >= now() - INTERVAL '${formatInterval(interval)}'
      GROUP BY "roverId"
      ORDER BY avgBattery ASC;
    `;

  const rows = await querySQL<any>(sql);

  return rows.map((row) => ({
    roverId: String(row.roverId ?? row["roverId"]),
    avgBattery: Number(row.avgBattery),
  }));
};

export const getRoverCountByStatus = async (
  interval = "1 hour",
): Promise<StatusCountRow[]> => {
  const sql = `
      SELECT
        status,
        COUNT(*) AS roverCount
      FROM rover
      WHERE time >= now() - INTERVAL '${formatInterval(interval)}'
      GROUP BY status
      ORDER BY roverCount DESC;
    `;

  const rows = await querySQL<any>(sql);

  return rows.map((row) => ({
    status: String(row.status),
    roverCount: Number(row.roverCount),
  }));
};

export const getRoverHistory = async (
  roverId: string,
  interval = "1 hour",
): Promise<RoverData[]> => {
  const sql = `
      SELECT
        time,
        "roverId",
        status,
        battery,
        health,
        busy,
        lat,
        lon
      FROM rover
      WHERE "roverId" = '${escapeString(roverId)}'
        AND time >= now() - INTERVAL '${formatInterval(interval)}'
      ORDER BY time DESC;
    `;

  const rows = await querySQL<any>(sql);
  return rows.map((row) => mapRoverRow(row));
};
