import amqp from "amqplib";
import { logger } from "../utils/logger"; 
import { rlGrpcClient } from "../gRPC/clients/RL.client"

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
        processOrder()

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




async function processOrder() {
  try {
    // Fetch available rovers from your DB here
    const rovers =  [
        { rover_id: "r1", latitude: 29.9575, longitude: 31.2820, status: "broken", battery_level: 0 },
        { rover_id: "r2", latitude: 29.9600, longitude: 31.2850, status: "idle", battery_level: 0.7 },
      ]

    if (!rovers || rovers.length === 0) {
      throw new Error("No available rovers");
    }

    const order = {
      latitude :  29.9650,
      longitude : 31.2900   

    }
    const result = await rlGrpcClient.assignRover(
      rovers.map((r) => ({
        rover_id: r.rover_id,
        latitude: r.latitude,
        longitude: r.longitude,
        status: r.status,
        battery_level: r.battery_level,
      })),
      order.latitude,
      order.longitude
    );

    if (!result.success || !result.roverId) {
      throw new Error(result.error || "RL model failed to assign a rover");
    }

    console.log( result.roverId)
    return result.roverId;

  } catch (error) {
    throw new Error(`processOrder failed: ${(error as Error).message}`);
  }
}

processOrder()