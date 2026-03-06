import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { logger } from "../../utils/logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/payment.proto`,
);
// const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "localhost:50052";
const PAYMENT_SERVICE_URL = isDevelopment
  ? "localhost:50052"
  : "payment-service:50052";

class PaymentGrpcClient {
  private client: any;
  constructor() {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const paymentProto = grpc.loadPackageDefinition(packageDefinition)
      .payment as any;

    this.client = new paymentProto.PaymentService(
      PAYMENT_SERVICE_URL,
      grpc.credentials.createInsecure(),
    );

    logger.info(`gRPC Payment Client connected to ${PAYMENT_SERVICE_URL}`);
  }

  async createPayment(
    userId: string,
    amount: Number,
    currency: string,
    description: string,
    metadata: any,
  ): Promise<{ success: boolean; payment?: any; error?: string }> {
    return new Promise((resolve, reject) => {
      this.client.createPayment(
        {
          customer_id: userId,
          amount,
          currency,
          description,
          metadata,
        },
        (error: any, response: any) => {
          if (error) {
            logger.error("gRPC getUser error:", error);
            reject(error);
            return;
          }

          resolve({
            success: response.success,
            payment: response.payment
              ? {
                  paymentIntentId: response.payment.paymentIntentId,
                  clientSecret: response.payment.clientSecret,
                  status: response.payment.status,
                }
              : undefined,
            error: response.error,
          });
        },
      );
    });
  }

  close(): void {
    if (this.client) {
      grpc.closeClient(this.client);
      logger.info("gRPC Payment Client disconnected");
    }
  }
}

export const paymentGrpcClient = new PaymentGrpcClient();

process.on("SIGTERM", () => {
  paymentGrpcClient.close();
});

process.on("SIGINT", () => {
  paymentGrpcClient.close();
});
