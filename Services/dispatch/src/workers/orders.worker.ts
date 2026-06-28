import amqp from "amqplib";
import { logger } from "../utils/logger"; 
import { rlGrpcClient } from "../gRPC/clients/RL.client"
import { telemetryGrpcClient } from "../gRPC/clients/telemetry.client";

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
      processOrder(orderData)

      try {

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



async function processOrder(orderData: any) {
  try {
    // 1. Fetch idle rovers from Telemetry via gRPC
    const telemetryResponse = await telemetryGrpcClient.getIdleRovers(orderData.company);
 
    if (!telemetryResponse.success || !telemetryResponse.rovers?.length) {
      throw new Error("No available rovers");
    }
 
    const rovers = telemetryResponse.rovers.map((r: any) => ({
      rover_id: r.rover_id,
      latitude: r.base_position.latitude,
      longitude: r.base_position.longitude,
      status: "idle",
      battery_level: r.battery_level,
      health_level:  r.health_level,
    }));
 
    // 2. Tournament loop: compare rovers two-by-two, winner advances 
    let champion = rovers[0];
 
    for (let i = 1; i < rovers.length; i++) {
      const result = await rlGrpcClient.assignRover(
        [champion, rovers[i]],
        orderData.destination.latitude,
        orderData.destination.longitude,
      );
 
      if (!result.success || !result.roverId) {
        throw new Error(result.error || "RL model failed to pick a rover");
      }
 
      champion = rovers.find((r: any) => r.rover_id === result.roverId) ?? champion;
    }
 
    logger.info(`Best rover selected: ${champion.rover_id}`);
 
    // 3. Assign the order to the winning rover via Telemetry gRPC 
    const assignResponse = await telemetryGrpcClient.assignOrder(
      orderData._id,
      champion.rover_id,
      {
        latitude: orderData.latitude,
        longitude: orderData.longitude,
      },
    );
 
    if (!assignResponse.success) {
      throw new Error(assignResponse.message || "Failed to assign order");
    }
 
    logger.info(`Order ${orderData._id} assigned to rover ${champion.rover_id} — task: ${assignResponse.assigned_order_id}`);
    return champion.rover_id;
 
  } catch (error) {
    throw new Error(`processOrder failed: ${(error as Error).message}`);
  }
}
 
