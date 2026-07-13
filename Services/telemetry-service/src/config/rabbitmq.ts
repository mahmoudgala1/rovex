import * as amqp from "amqplib";
import { env } from "./environment";

class RabbitMQConfig {
  private connection: any = null;
  private channel: any = null;
  private readonly url: string;

  private readonly EXCHANGE_NAME = "rovex.direct";
  private readonly EXCHANGE_TYPE = "direct";
  private readonly NOTIFICATION_QUEUE = "process-order";

  constructor() {
    this.url = env.RABBITMQ_URL;
  }

  async connect(): Promise<void> {
    try {
      console.log("Connecting to RabbitMQ...");

      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(
        this.EXCHANGE_NAME,
        this.EXCHANGE_TYPE,
        {
          durable: true,
        }
      );

      await this.channel.assertQueue(this.NOTIFICATION_QUEUE, {
        durable: true,
      });

        await this.channel.bindQueue(
          this.NOTIFICATION_QUEUE,
          this.EXCHANGE_NAME,
          "process-order-telemetry",
        );

      console.log("Connected to RabbitMQ");
      console.log(`Listening on queue: ${this.NOTIFICATION_QUEUE}`);

      this.connection.on("error", (err: Error) => {
        console.error("RabbitMQ connection error:", err);
        this.reconnect();
      });

      this.connection.on("close", () => {
        console.warn("RabbitMQ connection closed. Reconnecting...");
        this.reconnect();
      });
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      this.reconnect();
    }
  }

  private reconnect(): void {
    this.connection = null;
    this.channel = null;

    setTimeout(() => {
      console.log("Attempting to reconnect to RabbitMQ...");
      this.connect();
    }, 5000);
  }

  getChannel() {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized");
    }
    return this.channel;
  }

  getQueueName(): string {
    return this.NOTIFICATION_QUEUE;
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log("RabbitMQ connection closed");
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

export default new RabbitMQConfig();
