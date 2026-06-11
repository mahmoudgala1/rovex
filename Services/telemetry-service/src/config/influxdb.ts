import { InfluxDBClient } from "@influxdata/influxdb3-client";
import { env } from "./environment";

const influx: InfluxDBClient = new InfluxDBClient({
  host: env.INFLUX_URL!,
  token: env.INFLUX_TOKEN!,
  database: env.INFLUX_BUCKET!,
});

export default influx;
