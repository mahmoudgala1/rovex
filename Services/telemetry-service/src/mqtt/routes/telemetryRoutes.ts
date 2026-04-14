import { writeRoverData, writeRoversData } from "../../utils/influxdbWriter";
// import { broadcastTelemetry, roverTelemetry } from "../../utils/websocket";
import { publish } from "../mqttClient";
import { mqttRouter } from "../mqttRouter";

mqttRouter.topic("rovers-data", async (req, payload) => {
  // broadcastTelemetry(payload);
  await writeRoversData(payload);
});

mqttRouter.topic("rover-data/:roverId", async (req, payload) => {
  // roverTelemetry(req.params.roverId, payload);
  await writeRoverData(payload);
  publish(`rover-data/${req.params.roverId}/processed`, {
    roverId: req.params.roverId,
    status: "received",
  });
});
