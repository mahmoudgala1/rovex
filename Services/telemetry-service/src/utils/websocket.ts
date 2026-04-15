import { Server, Socket } from "socket.io";
import { getLatestRoverData, getLatestRoversData } from "./influxdbReader";

let io: Server;

const usersData = new Map<string, string>();

export const getUserSocket = (userId: string) => usersData.get(userId);
export const getConnectedUsers = () => usersData.size;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
    },
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

    socket.on("join_global_rovers", async () => {
      try {
        socket.join("global_rovers");
        const data = await getLatestRoversData();
        socket.emit("rovers_data", data);
        console.log(`[Socket.IO] ${userId} joined global_rovers`);
      } catch (err) {
        console.error("[Socket.IO] join_global_rovers error:", err);
        socket.emit("error", { message: "Failed to fetch rovers data" });
      }
    });

    socket.on("leave_global_rovers", () => {
      socket.leave("global_rovers");
      console.log(`[Socket.IO] ${userId} left global_rovers`);
    });

    socket.on("join_rover", async ({ roverId }: { roverId: string }) => {
      if (!roverId) {
        socket.emit("error", { message: "roverId is required" });
        return;
      }

      try {
        socket.join(`rover:${roverId}`);
        const data = await getLatestRoverData(roverId);
        socket.emit("rover_data", { roverId, ...data });
        console.log(`[Socket.IO] ${userId} joined rover:${roverId}`);
      } catch (err) {
        console.error(`[Socket.IO] join_rover error for ${roverId}:`, err);
        socket.emit("error", { message: "Failed to fetch rover data" });
      }
    });

    socket.on("leave_rover", ({ roverId }: { roverId: string }) => {
      socket.leave(`rover:${roverId}`);
      console.log(`[Socket.IO] ${userId} left rover:${roverId}`);
    });

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
  io.to(`rover:${roverId}`).emit("rover_data", { roverId, ...data });
  io.to("global_rovers").emit("rover_data", { roverId, ...data });
}

export function broadcastTelemetry(data: any) {
  if (!io) return;
  io.to("global_rovers").emit("rovers_data", data);
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
