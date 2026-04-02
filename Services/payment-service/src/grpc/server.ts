import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { PaymentGrpcService } from "./services/payment.service";
import { Logger } from "../utils/logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/payment.proto`,
);
const GRPC_PORT = process.env.GRPC_PORT || "50052";
const logger =new Logger("GRPC Server");

export const startGrpcServer = (): void => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const paymentProto = grpc.loadPackageDefinition(packageDefinition)
    .payment as any;

  const server = new grpc.Server();

  const paymentService = new PaymentGrpcService();

  server.addService(paymentProto.PaymentService.service, {
    createPayment: paymentService.createPayment.bind(paymentService),
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
