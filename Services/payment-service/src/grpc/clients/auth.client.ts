import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { Logger } from "../../utils/logger";
import { User } from "../../types/stripe.types";
import { env } from "../../config/environment";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/auth.proto`,
);
// const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_GRPC_URL || "localhost:50051";
const AUTH_SERVICE_URL = isDevelopment
  ? "localhost:50051"
  : "auth-service:50051";

class AuthGrpcClient {
  private client: any;
  private logger: Logger;

  constructor() {
    this.logger = new Logger("GRPC AuthClient");
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const authProto = grpc.loadPackageDefinition(packageDefinition).auth as any;

    this.client = new authProto.AuthService(
      AUTH_SERVICE_URL,
      grpc.credentials.createInsecure(),
    );

    this.logger.info(`gRPC Auth Client connected to ${AUTH_SERVICE_URL}`);
  }

  async getUser(
    userId: string,
    userType: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    return new Promise((resolve, reject) => {
      this.client.getUser({ user_id: userId, user_type: userType }, (error: any, response: any) => {
        if (error) {
          this.logger.error("gRPC getUser error:", error);
          reject(error);
          return;
        }

        resolve({
          success: response.success,
          user: response.user
            ? {
                customer_id: response.user.customer_id,
                email: response.user.email,
                name: response.user.name,
                phone: response.user.phone,
              }
            : undefined,
          error: response.error,
        });
      });
    });
  }

  close(): void {
    if (this.client) {
      grpc.closeClient(this.client);
      this.logger.info("gRPC Auth Client disconnected");
    }
  }
}

export const authGrpcClient = new AuthGrpcClient();

process.on("SIGTERM", () => {
  authGrpcClient.close();
});

process.on("SIGINT", () => {
  authGrpcClient.close();
});
