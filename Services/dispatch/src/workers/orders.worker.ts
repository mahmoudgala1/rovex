import amqp from "amqplib";
import { logger } from "../utils/logger"; 
import { rlGrpcClient } from "../gRPC/clients/RL.client"
import { telemetryGrpcClient } from "../gRPC/clients/telemetry.client";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE_NAME = "ecommerce_exchange";
const QUEUE_NAME = "dispatch_orders_queue";
const WAIT_QUEUE_NAME = "dispatch_orders_wait_queue";
const WAIT_EXCHANGE_NAME = "dispatch_wait_exchange";
const RETRY_DELAY_MS = 7 * 60 * 1000;
const MAX_RETRIES = 5;
export let sharedChannel: amqp.Channel | null = null;

export async function startDispatchWorker() {
  try {
   
    //connect
    const connection = await amqp.connect(RABBITMQ_URL);
    //create channel
    const channel = await connection.createChannel();
    //exchange
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    // create queue and bind it to the exchange
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: { "x-max-priority": 10 },
    });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.ready.#");
     await channel.assertExchange(WAIT_EXCHANGE_NAME, "direct", { durable: true });
    await channel.assertQueue(WAIT_QUEUE_NAME, {
      durable: true,
      arguments: {
        "x-message-ttl": RETRY_DELAY_MS,
        "x-dead-letter-exchange": EXCHANGE_NAME,
        "x-dead-letter-routing-key": "order.ready.retry",
      },
    });
    await channel.bindQueue(WAIT_QUEUE_NAME, WAIT_EXCHANGE_NAME, "order.wait");
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.ready.retry");
    //load balancer one job at a time
    channel.prefetch(1);
    sharedChannel = channel;
    logger.info(` Dispatch Worker started. Waiting for orders in ${QUEUE_NAME}...`);
    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) {
        logger.warn("Consumer cancelled by server");
        return;
      }

      const orderData = JSON.parse(msg.content.toString());
      logger.info(` Received Order: ${orderData._id} from ${msg.fields.routingKey}`);
    try {
        await processOrder(orderData, channel);
        channel.ack(msg);
        logger.info(`Order ${orderData._id} Processed & Ack'd`);
      } catch (error) {
        logger.error(`Error processing order ${orderData._id}`, error);
        channel.nack(msg, false, false);
      }
    });

    connection.on("close", () => {
      sharedChannel = null;
      logger.error("RabbitMQ connection closed. Retrying in 5s...");
      setTimeout(startDispatchWorker, 5000);
    });

  } catch (error) {
    logger.error("Failed to start worker:", error);
    setTimeout(startDispatchWorker, 5000); 
  }
}



async function processOrder(orderData: any, channel: amqp.Channel) {
  try {
    // 1. Fetch idle rovers from Telemetry via gRPC
    const telemetryResponse = await telemetryGrpcClient.getIdleRovers(orderData.company);
 
  if (!telemetryResponse.success || !telemetryResponse.rovers?.length) {
    handleNoRovers(orderData, channel);
    return;
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
    logger.warn(`Assignment failed for order ${orderData._id} — requeueing with high priority`);
    channel.publish(
      EXCHANGE_NAME,
      "order.ready.priority",
      Buffer.from(JSON.stringify(orderData)),
      { persistent: true, priority: 10 },
    );
    return;
  }
 
    logger.info(`Order ${orderData._id} assigned to rover ${champion.rover_id} — task: ${assignResponse.assigned_order_id}`);
    return champion.rover_id;
 
  } catch (error) {
    throw new Error(`processOrder failed: ${(error as Error).message}`);
  }
}
 

function handleNoRovers(orderData: any, channel: amqp.Channel) {
  const retries = orderData._retries ?? 0;
 
  if (retries >= MAX_RETRIES) {
    logger.warn(`Order ${orderData._id} exhausted ${MAX_RETRIES} retries with no rovers. Dropping.`);
    return;
  }
 
  const updatedOrder = { ...orderData, _retries: retries + 1 };
 
  logger.warn(`No rovers for order ${orderData._id} — retry ${retries + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s`);
 
  channel.publish(
    WAIT_EXCHANGE_NAME,
    "order.wait",
    Buffer.from(JSON.stringify(updatedOrder)),
    { persistent: true },
  );
}