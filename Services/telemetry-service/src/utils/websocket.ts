import { Server, Socket } from "socket.io";
// import { getLatestRoverData, getLatestRoversData } from "./influxdbReader";
import { publish } from "../mqtt/mqttClient";
import { RoverData, roverStore } from "../mqtt/routes/telemetryRoutes";

let io: Server;

// const usersData = new Map<string, string>();

// export const getUserSocket = (userId: string) => usersData.get(userId);
// export const getConnectedUsers = () => usersData.size;

const rooms = {
  fleetAll: () => "fleet:all",
  fleetCompany: (companyId: string) => `fleet:company:${companyId}`,
  trackingRover: (roverId: string) => `tracking:rover:${roverId}`,
};

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
    },
    transports: ["websocket", "polling"],
    path: "/telemetry-socket",
  });

  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth?.userId as string;

    if (!userId) {
      console.warn("[Socket.IO] Connection rejected — missing userId");
      socket.disconnect(true);
      return;
    }

    // usersData.set(userId, socket.id);
    console.log(
      `[Socket.IO] Connected: socketId=${socket.id} userId=${userId}`,
    );

    socket.on("join:fleet:all", async () => {
      try {
        socket.join(rooms.fleetAll());
        console.log(`[Socket.IO] ${userId} joined fleet:all`);
        // const data = await getLatestRoversData();
        socket.emit("fleet:snapshot", Array.from(roverStore.values()));
      } catch (err) {
        console.error("[Socket.IO] join:fleet:all error:", err);
        socket.emit("error", { message: "Failed to fetch rovers data" });
      }
    });

    socket.on(
      "join:fleet:company",
      async ({ companyId }: { companyId: string }) => {
        if (!companyId) {
          socket.emit("error", { message: "companyId is required" });
          return;
        }
        try {
          socket.join(rooms.fleetCompany(companyId));
          console.log(
            `[Socket.IO] ${userId} joined fleet:company:${companyId}`,
          );
          // const data = await getLatestRoversData();
          const companyRovers = Array.from(roverStore.values()).filter(
            (r) => r.companyId === companyId,
          );
          socket.emit("fleet:snapshot", companyRovers);
        } catch (err) {
          console.error(
            `[Socket.IO] join:fleet:company error for ${companyId}:`,
            err,
          );
          socket.emit("error", { message: "Failed to fetch rover data" });
        }
      },
    );

    socket.on("join:tracking:rover", ({ roverId }) => {
      if (!roverId) return;

      socket.join(rooms.trackingRover(roverId));

      const rover = roverStore.get(roverId);
      if (rover) {
        socket.emit("rover:snapshot", rover);
      }
    });

    socket.on("leave:room", ({ room }) => {
      if (room) socket.leave(room);
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
      // usersData.delete(userId);
      console.log(
        `[Socket.IO] Disconnected: socketId=${socket.id} userId=${userId}`,
      );
    });
  });

  return io;
}

export const fanoutTelemetry = (data: RoverData) => {
  // const fleetPayload = buildFleetPayload(data);
  // const mobilePayload = buildMobilePayload(data);

  io.to(rooms.fleetAll()).emit("rover:update", data);

  if (data.companyId !== "unknown") {
    io.to(rooms.fleetCompany(data.companyId)).emit("rover:update", data);
  }

  io.to(rooms.trackingRover(data.roverId)).emit("rover:tracking", data);
};

export function getIO(): Server {
  if (!io) throw new Error("[Socket.IO] Not initialized!");
  return io;
}
