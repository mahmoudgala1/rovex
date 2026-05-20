import { Server, Socket } from "socket.io";
import http from "http";

let io: Server;

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.WEB_APP_URL || "*",
      credentials: true,
    },
    transports: ["websocket", "polling"],
    path: "/notification-socket",
  });

  io.use((socket, next) => {
    try {
      const userId = socket.handshake.auth.userId as string | undefined;

      if (!userId) {
        return next(new Error("Unauthorized: missing userId"));
      }

      socket.data.userId = userId;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    const room = `user:${userId}`;

    socket.join(room);

    socket.emit("socket:connected", {
      success: true,
      userId,
      socketId: socket.id,
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function emitToUser(
  userId: string,
  event: string,
  payload: unknown,
): void {
  getIO().to(`user:${userId}`).emit(event, payload);
}
