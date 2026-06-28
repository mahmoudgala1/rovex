import * as grpc from "@grpc/grpc-js";
import { logger } from "../utils/logger";
import { sharedChannel } from "../workers/orders.worker";

const EXCHANGE_NAME = "ecommerce_exchange";

export class DispatchGrpcService {
  async orderFallbackHandler(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { orderData, company_id, reason } = call.request;

      if (!orderData || !company_id || !reason) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "orderData, company_id, and reason are required",
        } as any);
      }

      logger.info(`Fallback triggered for order ${orderData} — reason: ${reason}`);

      if (!sharedChannel) {
        return callback({
          code: grpc.status.UNAVAILABLE,
          message: "RabbitMQ channel not ready",
        } as any);
      }

      // Push the order back into the queue with high priority
      sharedChannel.publish(
        EXCHANGE_NAME,
        "order.ready.priority",
        Buffer.from(JSON.stringify({ orderData: orderData, company_id, reason })),
        {
          persistent: true,
          priority: 10, 
        },
      );

      logger.info(`Order ${orderData} re-queued with high priority`);

      callback(null, {
        handled: true,
        fallback_action: "QUEUED",
        message: `Order ${orderData} has been re-queued with high priority`,
      });

    } catch (error: any) {
      logger.error("orderFallbackHandler error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message ?? "Failed to handle fallback",
      } as any);
    }
  }
}