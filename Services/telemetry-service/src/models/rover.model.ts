import mongoose, { Document, Schema } from "mongoose";

export interface IPosition {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IRover extends Document {
  roverId: string;
  companyId?: string;
  basePosition: IPosition;
  isConnected: boolean;
  lastMaintenanceAt?: Date;
  nextMaintenanceAt?: Date;
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

const RoverSchema = new Schema<IRover>(
  {
    roverId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String,  index: true },
    basePosition: { type: PositionSchema, required: true },
    isConnected: { type: Boolean, default: false, index: true },
    lastMaintenanceAt: { type: Date },
    nextMaintenanceAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Rover = mongoose.model<IRover>("Rover", RoverSchema);
