import { ConsumeMessage } from "amqplib";
import rabbitmq from "../config/rabbitmq";
import { NotificationEvent, NotificationChannel } from "../types";
import { EmailChannel } from "../channels/email.channel";
import { BaseNotificationChannel } from "../channels/base.channel";

export class NotificationConsumer {
  private channels: Map<NotificationChannel, BaseNotificationChannel>;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.channels = new Map<NotificationChannel, BaseNotificationChannel>([
      [NotificationChannel.EMAIL, new EmailChannel()],
    ]);
  }

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
          const event: NotificationEvent = JSON.parse(msg.content.toString());
          await this.processEvent(event);
          channel.ack(msg);
        } catch (error: any) {
          console.error("Error processing event:", error.message);
          const retryCount = this.getRetryCount(msg);
          if (retryCount < this.MAX_RETRIES) {
            console.log(
              `Retrying... (${retryCount + 1}/${this.MAX_RETRIES})`
            );
            setTimeout(() => {
              channel.nack(msg, false, true);
            }, 5000 * (retryCount + 1));
          } else {
            console.error(
              `Max retries exceeded. Moving to dead letter queue.`
            );
            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );
  }

  private async processEvent(event: NotificationEvent): Promise<void> {
    const results = await Promise.allSettled(
      event.channels.map((channelType) =>
        this.sendToChannel(channelType, event)
      )
    );
    results.forEach((result, index) => {
      const channelType = event.channels[index];
      if (result.status === "fulfilled") {
        console.log(`${channelType}: Success`);
      } else {
        console.error(`${channelType}: ${result.reason}`);
      }
    });
  }


  private async sendToChannel(
    channelType: NotificationChannel,
    event: NotificationEvent
  ): Promise<void> {
    const channelHandler = this.channels.get(channelType);
    if (!channelHandler) {
      throw new Error(`Channel ${channelType} not supported`);
    }

    const recipient = this.getRecipient(event, channelType);
    if (!recipient) {
      throw new Error(`No recipient for channel ${channelType}`);
    }

    const result = await channelHandler.send(
      recipient,
      event.data,
      event.metadata
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to send notification");
    }
  }

  private getRecipient(
    event: NotificationEvent,
    channel: NotificationChannel
  ): string | null {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return event.data.email || null;
      case NotificationChannel.SMS:
        return event.data.phone || null;
      case NotificationChannel.PUSH:
        return event.data.fcmToken || null;
      default:
        return null;
    }
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


