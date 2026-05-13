import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { AuthGrpcService } from "./services/auth.service";
import { logger } from "../utils/logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/auth.proto`,
);
const GRPC_PORT = process.env.GRPC_PORT || "50051";

export const startGrpcServer = (): void => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const authProto = grpc.loadPackageDefinition(packageDefinition).auth as any;

  const server = new grpc.Server();

  const authService = new AuthGrpcService();

  server.addService(authProto.AuthService.service, {
    getUser: authService.getUser.bind(authService),
  });

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        logger.error("Failed to start gRPC server:", error);
        process.exit(1);
      }

      server.start();
      logger.info(`gRPC Server running on port ${port}`);
    },
  );
};
