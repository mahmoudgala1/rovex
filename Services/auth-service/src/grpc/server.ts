import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { AuthGrpcService } from "./services/auth.service";
import { logger } from "../utils/logger";
import { UserSubscriptionGrpcService } from "./services/subscription.service";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_DIR = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos`,
);

const authProtoPath = path.join(PROTO_DIR, "auth.proto");
const subscriptionProtoPath = path.join(PROTO_DIR, "subscription.proto");

const GRPC_PORT = process.env.GRPC_PORT || "50051";

const commonLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [PROTO_DIR],
};

export const startGrpcServer = (): void => {
  const authPackageDefinition = protoLoader.loadSync(
    authProtoPath,
    commonLoaderOptions,
  );
  const subscriptionPackageDefinition = protoLoader.loadSync(
    subscriptionProtoPath,
    commonLoaderOptions,
  );

  const authProto = grpc.loadPackageDefinition(authPackageDefinition)
    .auth as any;
  const subscriptionProto = grpc.loadPackageDefinition(
    subscriptionPackageDefinition,
  ).subscription as any;

  const server = new grpc.Server();

  const authService = new AuthGrpcService();
  const subscriptionService = new UserSubscriptionGrpcService();

  server.addService(authProto.AuthService.service, {
    getUser: authService.getUser.bind(authService),
  });

  server.addService(subscriptionProto.UserSubscriptionService.service, {
    GrantAccess: subscriptionService.grantAccess.bind(subscriptionService),
    RevokeAccess: subscriptionService.revokeAccess.bind(subscriptionService),
    UpdateSubscription:
      subscriptionService.updateSubscription.bind(subscriptionService),
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
