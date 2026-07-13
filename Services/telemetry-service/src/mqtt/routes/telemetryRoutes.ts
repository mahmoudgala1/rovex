// import { writeRoverData, writeRoversData } from "../../utils/influxdbWriter";
import { Task } from "../../models/task.model";
import { fanoutTelemetry } from "../../utils/websocket";
import { publish } from "../mqttClient";
import { mqttRouter } from "../mqttRouter";
import RabbitMQPublisher from "../../services/rabbitmq.service";

export interface RoverData {
  roverId: string;
  companyId: string;
  name?: string;
  color?: string;
  lat: number;
  lng: number;
  bearing?: number;
  battery?: number;
  speed?: number;
  speedMs?: number;
  speedMultiplier?: number;
  status?: string;
  trail?: [number, number][];
  distanceTraveled?: number;
  totalDistance?: number;
  eta?: number;
  currentAddress?: string;
  startAddress?: string;
  endAddress?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  lastSeen?: number;
}

export const roverStore = new Map<string, RoverData>();

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = toRad(lng2 - lng1);
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const x = Math.sin(dLng) * Math.cos(φ2);
  const y =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (toDeg(Math.atan2(x, y)) + 360) % 360;
}

mqttRouter.topic("rovex/:roverId/telemetry", async ({ params }, payload) => {
  const { roverId } = params;
  const prev = roverStore.get(roverId);

  let bearing = payload.bearing ?? prev?.bearing ?? 0;
  if (payload.bearing == null && prev) {
    const dist = calcDistance(prev.lat, prev.lng, payload.lat, payload.lng);
    bearing =
      dist > 0.5
        ? calcBearing(prev.lat, prev.lng, payload.lat, payload.lng)
        : (prev.bearing ?? 0);
  }

  const rover: RoverData = {
    roverId,
    companyId: payload.companyId ?? prev?.companyId ?? "unknown",
    name: payload.label ?? prev?.name ?? roverId,
    color: payload.color ?? prev?.color ?? "#00d4ff",
    lat: payload.lat,
    lng: payload.lng,
    bearing,
    speed: payload.speed ?? 0,
    speedMs: payload.speedMs ?? 0,
    speedMultiplier: payload.speedMultiplier ?? 1,
    status: payload.status ?? "idle",
    battery: payload.battery ?? prev?.battery ?? 100,
    trail: payload.trail ?? prev?.trail ?? [],
    distanceTraveled: payload.distanceTraveled ?? 0,
    totalDistance: payload.totalDistance ?? 0,
    eta: payload.eta ?? 0,
    currentAddress: payload.currentAddress,
    startAddress: payload.startAddress,
    endAddress: payload.endAddress,
    startLat: payload.startLat,
    startLng: payload.startLng,
    endLat: payload.endLat,
    endLng: payload.endLng,
    lastSeen: Date.now(),
  };

  roverStore.set(roverId, rover);

  fanoutTelemetry(rover);

  if (rover.status === "arrived") {
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    await Task.findOneAndUpdate(
      { taskId: payload.missionId },
      {
        status: "DELIVERED",
        completedAt: new Date(),
        otp: OTP,
      },
      { new: true },
    );
    await RabbitMQPublisher.publishEvent("order-arrived", {
      orderId: payload.orderId,
      customerId: payload.customerId,
      otp: OTP,
    });
  }

  // await writeRoverData(rover);
  // await writeRoversData([...roverStore.values()]);

  publish(`rovex/${roverId}/ack`, { status: "received", ts: Date.now() });
});

mqttRouter.topic("rovex/:roverId/status", async ({ params }, payload) => {
  const { roverId } = params;
  const rover = roverStore.get(roverId);
  if (!rover) return;

  const updated: RoverData = {
    ...rover,
    status: payload.status ?? rover.status,
    battery: payload.battery ?? rover.battery,
    lastSeen: Date.now(),
  };

  roverStore.set(roverId, updated);
  fanoutTelemetry(updated);
});

mqttRouter.topic("rovex/:roverId/ready", async ({ params }, payload) => {
  await Task.findOneAndUpdate(
    { taskId: payload.missionId },
    { status: "IN_TRANSIT" },
    { new: true },
  );
  await RabbitMQPublisher.publishEvent("process-order-ecommerce", payload);
});

// ── Stale Rover Cleanup ───────────────────────────────────────────
// setInterval(() => {
//   const TIMEOUT = 30_000;
//   const now     = Date.now();

//   roverStore.forEach((rover, id) => {
//     if ((rover.lastSeen ?? 0) && now - rover.lastSeen! > TIMEOUT) {
//       const stale: RoverData = { ...rover, status: "offline" };
//       roverStore.set(id, stale);
//       fanoutTelemetry(stale);
//       console.warn(`Rover ${id} → offline (no GPS > 30s)`);
//     }
//   });
// }, 10_000);
