import mongoose, { Schema, Document } from "mongoose";
import { Notification } from "../types/notification.types";

export interface INotification extends Notification, Document {}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    // type: { type: String, required: true, index: true },
    // channel: {
    //   type: String,
    //   enum: ["push", "email", "sms", "in-app"],
    //   required: true,
    // },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  NotificationSchema,
);
