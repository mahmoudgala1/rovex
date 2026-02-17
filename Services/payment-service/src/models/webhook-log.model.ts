import mongoose, { Schema, Document } from "mongoose";

export interface IWebhookLog extends Document {
  eventId: string;
  eventType: string;
  payload: Record<string, any>;
  status: "processing" | "processed" | "failed";
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const webhookLogSchema = new Schema<IWebhookLog>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["processing", "processed", "failed"],
      default: "processing",
    },
    error: String,
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

webhookLogSchema.index({ status: 1, retryCount: 1 });

export const WebhookLogModel = mongoose.model<IWebhookLog>(
  "WebhookLog",
  webhookLogSchema,
);
