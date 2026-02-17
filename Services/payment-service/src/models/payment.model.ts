import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  providerId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    providerId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ["succeeded", "processing", "requires_payment_method", "failed"],
      required: true,
    },
    description: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

// Compound index for queries
paymentSchema.index({ customerId: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);
