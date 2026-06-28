import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { logger } from "../../utils/logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/telemetry.proto`,
);
const TELEMETRY_SERVICE_URL = isDevelopment
  ? "localhost:50054"
  : "telemetry-service:50054";

class TelemetryGrpcClient {
  private client: any;

  constructor() {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const telemetryProto = grpc.loadPackageDefinition(packageDefinition)
      .telemetry as any;

    this.client = new telemetryProto.TelemetryService(
      TELEMETRY_SERVICE_URL,
      grpc.credentials.createInsecure(),
    );

    logger.info(`gRPC Telemetry Client connected to ${TELEMETRY_SERVICE_URL}`);
  }

  async getIdleRovers(
    companyId: string,
  ): Promise<{ success: boolean; rovers?: any[]; total_count?: number }> {
    return new Promise((resolve, reject) => {
      this.client.getIdleRovers(
        { company_id: companyId },
        (error: any, response: any) => {
          if (error) {
            logger.error("gRPC getIdleRovers error:", error);
            reject(error);
            return;
          }

          resolve({
            success: response.success,
            rovers: response.rovers,
            total_count: response.total_count,
          });
        },
      );
    });
  }

  async assignOrder(
    orderId: string,
    roverId: string,
    destinationPosition: { latitude: number; longitude: number },
  ): Promise<{ success: boolean; assigned_order_id?: string; message?: string }> {
    return new Promise((resolve, reject) => {
      this.client.assignOrder(
        {
          order_id: orderId,
          rover_id: roverId,
          destination_position: destinationPosition,
        },
        (error: any, response: any) => {
          if (error) {
            logger.error("gRPC assignOrder error:", error);
            reject(error);
            return;
          }

          resolve({
            success: response.success,
            assigned_order_id: response.assigned_order_id,
            message: response.message,
          });
        },
      );
    });
  }

  close(): void {
    if (this.client) {
      grpc.closeClient(this.client);
      logger.info("gRPC Telemetry Client disconnected");
    }
  }
}

export const telemetryGrpcClient = new TelemetryGrpcClient();

process.on("SIGTERM", () => {
  telemetryGrpcClient.close();
});

process.on("SIGINT", () => {
  telemetryGrpcClient.close();
});