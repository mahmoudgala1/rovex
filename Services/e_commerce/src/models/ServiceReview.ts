import mongoose, { Document, Schema } from "mongoose";

export interface IServiceReview extends Document {
  userId: string;
  companyId: string;
  orderId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  roverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceReviewSchema = new Schema<IServiceReview>(
  {
    userId: { type: String, ref: "User", required: true },
    companyId: { type: String, ref: "Company", required: true },
    orderId: {
      type: String,
      ref: "Order",
      required: true,
      unique: true,
    },
    userName: { type: String, required: true },
    userAvatarUrl: { type: String },
    rating: { type: Number, enum: [4, 5], required: true },
    comment: { type: String },
    isVisible: { type: Boolean, default: true },
    roverId: { type: String, ref: "Rover" },
  },
  { timestamps: true },
);

export const ServiceReview = mongoose.model<IServiceReview>(
  "ServiceReview",
  ServiceReviewSchema,
);
