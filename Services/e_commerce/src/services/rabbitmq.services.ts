import amqp from "amqplib";
import {logger} from "../utils/logger"
interface GeoPoint {
  type: "Point";
  coordinates: number[]; 
}

interface OrderMessage {
  _id: string;
  company: string;
  order_status: string;
  location: GeoPoint;
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE_NAME = "ecommerce_exchange";

export async function publishOrder(order: OrderMessage) {
  const companyId= order.company  
  const ROUTING_KEY = `order.ready.${companyId}`;
  let connection = null;
  let channel = null;
  
  try {
    connection = await amqp.connect(RABBITMQ_URL);

    channel = await connection.createChannel();

    
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(order));
    channel.publish(EXCHANGE_NAME, ROUTING_KEY, messageBuffer, {
      persistent: true,
    });

    logger.info(`[x] Order published: ${order._id}`);
    
  } catch (error) {
    logger.error("Failed to publish order:", error);
  } finally {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
  }
}


