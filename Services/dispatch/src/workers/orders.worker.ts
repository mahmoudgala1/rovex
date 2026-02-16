import amqp from "amqplib";
import { logger } from "../utils/logger"; 

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE_NAME = "ecommerce_exchange";
const QUEUE_NAME = "dispatch_orders_queue";

export async function startDispatchWorker() {
  try {
   
    //connect
    const connection = await amqp.connect(RABBITMQ_URL);
    //create channel
    const channel = await connection.createChannel();
    //exchange
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    // create queue and bind it to the exchange
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.ready.#");
    //load balancer one job at a time
    channel.prefetch(1);

    logger.info(` Dispatch Worker started. Waiting for orders in ${QUEUE_NAME}...`);
    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) {
        logger.warn("Consumer cancelled by server");
        return;
      }

      const orderData = JSON.parse(msg.content.toString());
      logger.info(` Received Order: ${orderData._id} from ${msg.fields.routingKey}`);

      try {
        processOrder(orderData)

        channel.ack(msg);
        logger.info(`Order ${orderData._id} Processed & Ack'd`);

      } catch (error) {
        logger.error(`Error processing order ${orderData._id}`, error);
        
        // Negative Acknowledge (Nack)
        channel.nack(msg, false, false); 
      }
    });

    connection.on("close", () => {
      logger.error("RabbitMQ connection closed. Retrying in 5s...");
      setTimeout(startDispatchWorker, 5000);
    });

  } catch (error) {
    logger.error("Failed to start worker:", error);
    setTimeout(startDispatchWorker, 5000); 
  }
}


async function processOrder(order: any) {
  return new Promise((resolve) => {
    setTimeout(() => {
      
      logger.debug(`🧠 AI assigning rover for Order ${order._id}...`);
      resolve(true);
    }, 2000); 
        logger.info(` ${order._id} processing is done`);
  });

}

