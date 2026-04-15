import mqtt from "mqtt";
import { mqttRouter } from "./mqttRouter";
import { env } from "../config/environment";

let client: mqtt.MqttClient;

export const initMqttClient = () => {
  client = mqtt.connect(env.MQTT_URL || "mqtt://mqtt-broker:1883");

  client.on("connect", () => {
    console.log("MQTT Connected");

    client.subscribe(["rovers-data", "rover-data/+"], (err) => {
      if (err) console.error("MQTT subscribe error:", err);
      else console.log("MQTT Subscribed to topics");
    });
  });

  client.on("message", (topic, message) => {
    mqttRouter.handle(topic, message.toString());
  });
  return client;
};

export const publish = (topic: string, payload: any) => {
  if (!client) throw new Error("MQTT client not initialized!");

  client.publish(topic, JSON.stringify(payload), { qos: 1 });
};
