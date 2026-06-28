import mqtt from "mqtt";
import { mqttRouter } from "./mqttRouter";
import { env } from "../config/environment";

let client: mqtt.MqttClient;

export const initMqttClient = () => {
  client = mqtt.connect(env.MQTT_URL ?? "mqtt://mqtt-broker:1883", {
    clientId: `rovex-server-${Date.now()}`,
    clean: true,
    will: {
      topic: "rovex/server/status",
      payload: "offline",
      qos: 1 as const,
      retain: true,
    },
  });

  client.on("connect", () => {
    console.log("MQTT Connected");

    client.subscribe(
      ["rovex/+/telemetry", "rovex/+/status"],
      { qos: 0 },
      (err) => {
        if (err) console.error("MQTT subscribe error:", err);
        else console.log("MQTT Subscribed → rovex/+/telemetry, rovex/+/status");
      },
    );

    client.publish("rovex/server/status", "online", { retain: true });
  });

  client.on("error", (err) => console.error("MQTT error:", err));
  client.on("offline", () => console.warn("MQTT offline"));

  client.on("message", (topic, message) => {
    if (topic === "rovex/server/status") return;

    mqttRouter.handle(topic, message.toString());
  });

  return client;
};

export const publish = (topic: string, payload: any) => {
  if (!client) throw new Error("MQTT client not initialized!");
  client.publish(topic, JSON.stringify(payload), { qos: 1 });
};
