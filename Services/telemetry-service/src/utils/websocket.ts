import { Server, Socket } from "socket.io";
import { getLatestRoverData, getLatestRoversData } from "./influxdbReader";
import { publish } from "../mqtt/mqttClient";

let io: Server;

const usersData = new Map<string, string>();

export const getUserSocket = (userId: string) => usersData.get(userId);
export const getConnectedUsers = () => usersData.size;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth?.userId as string;

    if (!userId) {
      console.warn("[Socket.IO] Connection rejected — missing userId");
      socket.disconnect(true);
      return;
    }

    usersData.set(userId, socket.id);
    console.log(
      `[Socket.IO] Connected: socketId=${socket.id} userId=${userId}`,
    );

    socket.on("join:globalrovers", async () => {
      try {
        socket.join("globalrovers");
        // const data = await getLatestRoversData();
        // socket.emit("roversdata", data);
        console.log(`[Socket.IO] ${userId} joined globalrovers`);
      } catch (err) {
        console.error("[Socket.IO] join:globalrovers error:", err);
        socket.emit("error", { message: "Failed to fetch rovers data" });
      }
    });

    socket.on("leave:globalrovers", () => {
      socket.leave("globalrovers");
      console.log(`[Socket.IO] ${userId} left globalrovers`);
    });

    socket.on("join:rover", async ({ userId }: { userId: string}) => {
      if (!userId) {
        socket.emit("error", { message: "roverId is required" });
        return;
      }

      try {
        socket.join(`rover:${userId}`);
        // const data = await getLatestRoverData(userId);
        // socket.emit("roverdata", { userId, ...data });
        console.log(`[Socket.IO] ${userId} joined rover:${userId}`);
      } catch (err) {
        console.error(`[Socket.IO] join:rover error for ${userId}:`, err);
        socket.emit("error", { message: "Failed to fetch rover data" });
      }
    });

    socket.on("leave:rover", ({ userId }: { userId: string }) => {
      socket.leave(`rover:${userId}`);
      console.log(`[Socket.IO] ${userId} left rover:${userId}`);
    });

    socket.on(
      "rover:command",
      (data: { roverId: string; cmd: string; value?: number }) => {
        const topic = `rovex/${data.roverId}/command`;
        const payload = JSON.stringify({ cmd: data.cmd, value: data.value });

        publish(topic, payload);
        console.log(`Command → ${topic}:`, data.cmd);
      },
    );

    socket.on("disconnect", () => {
      usersData.delete(userId);
      console.log(
        `[Socket.IO] Disconnected: socketId=${socket.id} userId=${userId}`,
      );
    });
  });

  return io;
}

export function roverTelemetry(roverId: string, data: any) {
  if (!io) return;
  io.to(`rover:viewer-${roverId}`).emit("roverdata", { roverId, ...data });
  // io.to("globalrovers").emit("roversdata", { roverId, ...data });
}

export function broadcastTelemetry(data: any) {
  if (!io) return;
  io.to("globalrovers").emit("roversdata", data);
}

export function notifyUser(userId: string, event: string, data: any) {
  if (!io) return;
  const socketId = usersData.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

export function getIO(): Server {
  if (!io) throw new Error("[Socket.IO] Not initialized!");
  return io;
}
