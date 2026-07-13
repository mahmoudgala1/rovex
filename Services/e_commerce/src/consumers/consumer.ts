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
          const routingKey = msg.fields.routingKey;
          const event = JSON.parse(msg.content.toString());
          console.log(`Received event with routing key: ${routingKey}`, event);
          switch (routingKey) {
            case "update-order":
              const orderToUpdate = await OrderModel.findOne({
                _id: event.orderId,
              });
              if (!orderToUpdate) throw new AppError("Order not found", 404);
              orderToUpdate.order_status = "Processing";
              orderToUpdate.payment_status = "Paid";
              await orderToUpdate.save();
              await RabbitMQPublisher.publishEvent("send-notification", {
                channels: ["push"],
                data: {
                  userId: orderToUpdate.user,
                  title: "Payment Successful",
                  body: "Your payment has been successfully processed. Your order is now being prepared for delivery.",
                },
                metadata: {
                  timestamp: new Date().toLocaleString(),
                },
              });
              await RabbitMQPublisher.publishEvent("process-order-telemetry", {
                orderId: orderToUpdate._id,
                companyId: orderToUpdate.company,
                customerId: orderToUpdate.user,
                destinationPosition: {
                  latitude: orderToUpdate.location.coordinates[1],
                  longitude: orderToUpdate.location.coordinates[0],
                  address: "address",
                },
              });
              break;
            case "process-order-ecommerce":
              const orderToProcess = await OrderModel.findOne({
                _id: event.orderId,
              });
              if (!orderToProcess) throw new AppError("Order not found", 404);
              orderToProcess.order_status = "Processing";
              orderToProcess.roverId = event.roverId;
              await orderToProcess.save();
              await RabbitMQPublisher.publishEvent("send-notification", {
                channels: ["push"],
                data: {
                  userId: orderToProcess.user,
                  title: "Order Out for Delivery",
                  body: "Your order is on its way and will arrive soon. You can track its progress in real time.",
                },
                metadata: {
                  timestamp: new Date().toLocaleString(),
                },
              });
              break;
            case "order-arrived":
              const orderToArrive = await OrderModel.findOne({
                _id: event.orderId,
              });
              if (!orderToArrive) throw new AppError("Order not found", 404);
              orderToArrive.order_status = "Delivered";
              await orderToArrive.save();
              await RabbitMQPublisher.publishEvent("send-notification", {
                channels: ["push"],
                data: {
                  userId: orderToArrive.user,
                  title: "Order Delivered",
                  body: `Your order is almost here! Please provide this verification code to the rover upon delivery: ${event.otp}`,
                },
                metadata: {
                  timestamp: new Date().toLocaleString(),
                },
              });
              break;
            default:
              console.warn(`Unhandled routing key: ${routingKey}`);
              channel.ack(msg);
          }

          channel.ack(msg);
        } catch (error: any) {
          console.error("Error processing event:", error.message);
          // const retryCount = this.getRetryCount(msg);
          // if (retryCount < this.MAX_RETRIES) {
          //   console.log(`Retrying... (${retryCount + 1}/${this.MAX_RETRIES})`);
          //   setTimeout(
          //     () => {
          //       channel.nack(msg, false, true);
          //     },
          //     5000 * (retryCount + 1),
          //   );
          // } else {
          //   console.error(`Max retries exceeded. Moving to dead letter queue.`);
          channel.nack(msg, false, false);
          // }
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
