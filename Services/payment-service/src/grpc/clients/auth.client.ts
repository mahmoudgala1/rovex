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

  //   async verifyToken(
  //     token: string,
  //   ): Promise<{ valid: boolean; user?: User; error?: string }> {
  //     return new Promise((resolve, reject) => {
  //       this.client.verifyToken({ token }, (error: any, response: any) => {
  //         if (error) {
  //           this.logger.error("gRPC verifyToken error:", error);
  //           reject(error);
  //           return;
  //         }

  //         resolve({
  //           valid: response.valid,
  //           user: response.user
  //             ? {
  //                 id: response.user.id,
  //                 email: response.user.email,
  //                 name: response.user.name,
  //                 role: response.user.role,
  //                 permissions: response.user.permissions || [],
  //                 metadata: response.user.metadata || {},
  //               }
  //             : undefined,
  //           error: response.error,
  //         });
  //       });
  //     });
  //   }

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

  //   async checkPermission(
  //     userId: string,
  //     permission: string,
  //   ): Promise<{ allowed: boolean; error?: string }> {
  //     return new Promise((resolve, reject) => {
  //       this.client.checkPermission(
  //         { user_id: userId, permission },
  //         (error: any, response: any) => {
  //           if (error) {
  //            this.logger.error("gRPC checkPermission error:", error);
  //             reject(error);
  //             return;
  //           }

  //           resolve({
  //             allowed: response.allowed,
  //             error: response.error,
  //           });
  //         },
  //       );
  //     });
  //   }

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
