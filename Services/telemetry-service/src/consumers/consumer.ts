import { ConsumeMessage } from "amqplib";
import rabbitmq from "../config/rabbitmq";
import { Rover } from "../models/rover.model";
import { Task } from "../models/task.model";
import { publish } from "../mqtt/mqttClient";

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

          const companyRovers = await Rover.find({
            companyId: event.companyId,
            isConnected: true,
          });

          const selectedRover =
            companyRovers[Math.floor(Math.random() * companyRovers.length)];

          const task = await Task.create({
            orderId: event.orderId,
            roverId: selectedRover.roverId,
            status: "PENDING",
            destination: event.destinationPosition,
            assignedAt: new Date(),
          });

          console.log(
            `Task created: ${task.taskId} for order: ${event.orderId} assigned to rover: ${selectedRover.roverId}`,
          );

          const roverTask = {
            missionId: task.taskId,
            orderId: event.orderId,
            companyId: event.companyId,
            roverId: selectedRover.roverId,
            customerId: event.customerId,
            pickup: {
              lat: selectedRover.basePosition.latitude,
              lng: selectedRover.basePosition.longitude,
            },
            dropoff: {
              lat: event.destinationPosition.latitude,
              lng: event.destinationPosition.longitude,
            },
            label: "Rover 1",
            color: "#00d4ff",
            battery: 100,
            speedMs: 5,
          };

          publish(
            `rovex/${selectedRover.roverId}/init`,
            JSON.stringify(roverTask),
          );

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
