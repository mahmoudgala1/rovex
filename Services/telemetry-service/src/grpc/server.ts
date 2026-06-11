import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { TelemetryGrpcService } from "./services/telemetry.service";
import { Logger } from "../utils/logger";

const logger = new Logger("GrpcServer");

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/telemetry.proto`,
);
const GRPC_PORT = process.env.GRPC_PORT || "50054";

export const startGrpcServer = (): void => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const telemetryProto = grpc.loadPackageDefinition(packageDefinition).telemetry as any;

  const server = new grpc.Server();

  const telemetryService = new TelemetryGrpcService();

  server.addService(telemetryProto.TelemetryService.service, {
    getIdleRovers: telemetryService.getIdleRovers.bind(telemetryService),
    assignOrder: telemetryService.assignOrder.bind(telemetryService),
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
