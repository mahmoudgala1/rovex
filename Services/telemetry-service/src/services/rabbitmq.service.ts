import RabbitMQConfig from "../config/rabbitmq";

class RabbitMQPublisher {
  private readonly EXCHANGE_NAME = "rovex.direct";

  async publishEvent(routingKey: string, event: any): Promise<boolean> {
    try {
      const channel = RabbitMQConfig.getChannel();
      const messageBuffer = Buffer.from(JSON.stringify(event));

      const options = {
        persistent: true,
        contentType: "application/json",
        contentEncoding: "utf-8",
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      };

      const published = channel.publish(
        this.EXCHANGE_NAME,
        routingKey,
        messageBuffer,
        options
      );

      if (!published) {
        console.warn(`Message buffer full for routing key: ${routingKey}`);
        return false;
      }

      console.log(`Published event: ${routingKey}`, event);

      return true;
    } catch (error) {
      console.error(`Failed to publish event: ${routingKey}`, error);
      throw error;
    }
  }

  async publishBatch(
    events: Array<{ routingKey: string; event: any }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const { routingKey, event } of events) {
      try {
        const published = await this.publishEvent(routingKey, event);
        if (published) success++;
        else failed++;
      } catch (error) {
        failed++;
      }
    }
    console.log(
      `Batch publish completed: ${success} success, ${failed} failed`
    );
    return { success, failed };
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new RabbitMQPublisher();
