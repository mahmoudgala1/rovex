import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { DispatchGrpcService } from "../../services/dispatch.service";
import { logger } from "../../utils/logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/dispatch.proto`,
);
const GRPC_PORT = process.env.GRPC_PORT || "50055";

export const startGrpcServer = (): void => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const dispatchProto = grpc.loadPackageDefinition(packageDefinition).dispatch as any;

  const server = new grpc.Server();

  const dispatchService = new DispatchGrpcService();

  server.addService(dispatchProto.DispatchService.service, {
    orderFallbackHandler: dispatchService.orderFallbackHandler.bind(dispatchService),
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
      logger.info(`gRPC Dispatch Server running on port ${port}`);
    },
  );
};