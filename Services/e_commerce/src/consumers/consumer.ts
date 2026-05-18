import { ConsumeMessage } from "amqplib";
import rabbitmq from "../config/rabbitmq";
import { OrderModel } from "../models/order.model";
import { AppError } from "../utils/AppError";
import RabbitMQPublisher from "../services/rabbitmq.service";

export class NotificationConsumer {
  private readonly MAX_RETRIES = 3;

  async start(): Promise<void> {
    const channel = rabbitmq.getChannel();
    const queueName = rabbitmq.getQueueName();

    await channel.prefetch(1);

    console.log("Notification consumer started...");

    channel.consume(
      queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(event);

          const order = await OrderModel.findOne({
            _id: event.orderId,
          });
          if (!order) throw new AppError("Order not found", 404);
          order.order_status = "Processing";
          order.payment_status = "Paid";
          await order.save();
          channel.ack(msg);

          await RabbitMQPublisher.publishEvent("send-notification", {
            channels: ["push"],
            data: {
              userId: order.user,
              title: "Payment Successful",
              body: `Your payment for order #${order._id} has been confirmed and is now being processed.`,
            },
            metadata: {
              timestamp: new Date().toLocaleString(),
            },
          });
        } catch (error: any) {
          console.error("Error processing event:", error.message);
          const retryCount = this.getRetryCount(msg);
          if (retryCount < this.MAX_RETRIES) {
            console.log(`Retrying... (${retryCount + 1}/${this.MAX_RETRIES})`);
            setTimeout(
              () => {
                channel.nack(msg, false, true);
              },
              5000 * (retryCount + 1),
            );
          } else {
            console.error(`Max retries exceeded. Moving to dead letter queue.`);
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false },
    );
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const xDeathHeader = msg.properties.headers?.["x-death"];
    if (xDeathHeader && Array.isArray(xDeathHeader)) {
      return xDeathHeader[0]?.count || 0;
    }
    return 0;
  }
}

export default new NotificationConsumer();
