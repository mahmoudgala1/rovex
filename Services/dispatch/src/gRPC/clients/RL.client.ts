import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { logger } from "../../utils/logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/rl.proto`,
);
const RL_SERVICE_URL = isDevelopment ? "localhost:50053" : "rl-service:50053";

export interface Rover {
  rover_id: string;
  latitude: number;
  longitude: number;
  status: string;
  battery_level: number;
}

class RLGrpcClient {
  private client: any;

  constructor() {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const rlProto = grpc.loadPackageDefinition(packageDefinition).rl as any;

    this.client = new rlProto.RLService(
      RL_SERVICE_URL,
      grpc.credentials.createInsecure(),
    );

    logger.info(`gRPC RL Client connected to ${RL_SERVICE_URL}`);
  }

  async assignRover(
    rovers: Rover[],
    orderLatitude: number,
    orderLongitude: number,
  ): Promise<{ success: boolean; roverId?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      this.client.assignRover(
        {
          rovers,
          order_latitude: orderLatitude,
          order_longitude: orderLongitude,
        },
        (error: any, response: any) => {
          if (error) {
            logger.error("gRPC assignRover error:", error);
            reject(error);
            return;
          }

          resolve({
            success: response.success,
            roverId: response.rover_id || undefined,
            error: response.error || undefined,
          });
        },
      );
    });
  }

  close(): void {
    if (this.client) {
      grpc.closeClient(this.client);
      logger.info("gRPC RL Client disconnected");
    }
  }
}

export const rlGrpcClient = new RLGrpcClient();

process.on("SIGTERM", () => {
  rlGrpcClient.close();
});

process.on("SIGINT", () => {
  rlGrpcClient.close();
});