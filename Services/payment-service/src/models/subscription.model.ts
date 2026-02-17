import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  providerId: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    providerId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    priceId: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "past_due", "unpaid", "canceled", "trialing"],
      required: true,
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    canceledAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

subscriptionSchema.index({ customerId: 1, status: 1 });

export const SubscriptionModel = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
