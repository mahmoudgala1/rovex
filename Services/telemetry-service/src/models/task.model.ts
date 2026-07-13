import mongoose, { Document, Schema, Types } from "mongoose";

export enum TaskStatus {
  PENDING = "PENDING", // assigned, rover not yet moving
  IN_TRANSIT = "IN_TRANSIT", // rover picked up and is delivering
  DELIVERED = "DELIVERED", // successfully delivered
  FAILED = "FAILED", // could not complete
  CANCELLED = "CANCELLED", // cancelled before pickup
}

export interface IPosition {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ITask extends Document {
  taskId: mongoose.Types.ObjectId;
  orderId: string;
  roverId: string;
  status: TaskStatus;
  destination: IPosition;
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema = new Schema<IPosition>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false },
);

const TaskSchema = new Schema<ITask>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      default: () => new Types.ObjectId(),
      unique: true,
      index: true,
    },
    orderId: { type: String, required: true, index: true },
    roverId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      index: true,
    },
    destination: { type: PositionSchema, required: true },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

TaskSchema.index({ roverId: 1, status: 1 });
TaskSchema.index({ orderId: 1, companyId: 1 });

export const Task = mongoose.model<ITask>("Task", TaskSchema);
