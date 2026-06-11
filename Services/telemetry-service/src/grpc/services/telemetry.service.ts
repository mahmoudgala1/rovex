import { Task, TaskStatus } from "../../models/task.model";
import { Rover } from "../../models/rover.model";
import * as grpc from "@grpc/grpc-js";
import { getLatestRecordsForRoverIds } from "../../utils/influxdbReader";

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}_${timestamp}${random}`;
}

export class TelemetryGrpcService {
  async getIdleRovers(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { company_id } = call.request;
      if (!company_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "company_id is required",
        } as any);
      }

      const rovers = await Rover.find({
        companyId: company_id,
        isConnected: true,
      });


      const responseRovers = rovers.map((rover) => ({
        rover_id: rover.roverId,
        base_position: rover.basePosition,
      }));

      callback(null, {
        success: true,
        rovers: responseRovers,
        total_count: rovers.length,
      });
    } catch (error: any) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message ?? "Failed to get idle rovers",
      } as any);
    }
  }

  async assignOrder(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { order_id, rover_id, destination_position } = call.request;

      if (!order_id || !rover_id || !destination_position) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "order_id, rover_id, and destination_position are required",
        } as any);
      }

      const rover = await Rover.findOne({ roverId: rover_id });

      if (!rover) {
        return callback(null, {
          success: false,
          assigned_order_id: "",
          message: "Rover not found",
        });
      }

      if (!rover.isConnected) {
        return callback(null, {
          success: false,
          assigned_order_id: "",
          message: "Rover is offline",
        });
      }

      const existingActiveTask = await Task.findOne({
        roverId: rover_id,
        status: {
          $in: [TaskStatus.PENDING, TaskStatus.IN_TRANSIT],
        },
      }).lean();

      if (existingActiveTask) {
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: "Rover already has an active task",
        });
      }

      const task = await Task.create({
        taskId: generateId("TASK"),
        orderId: order_id,
        roverId: rover_id,
        status: TaskStatus.PENDING,
        destination: destination_position,
        assignedAt: new Date(),
      });

      //   if (rover.batteryLevel < 20) {
      //     return callback(null, {
      //       success: false,
      //       assigned_order_id: "",
      //       message: "Rover battery too low",
      //     });
      //   }

      callback(null, {
        success: true,
        assigned_order_id: task.taskId,
        message: `Order assigned successfully to ${rover_id}`,
      });
    } catch (error: any) {
      callback({
        code: grpc.status.INTERNAL,
        message: error.message ?? "Failed to assign order",
      } as any);
    }
  }
}
