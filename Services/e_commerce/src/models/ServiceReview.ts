import mongoose, { Document, Schema } from "mongoose";

export interface IServiceReview extends Document {
  userId: String;
  companyId: String;
  orderId: String;
  userName: string;
  rating: 4 | 5;
  comment?: string;
  isVisible: boolean;
  roverId?: String;
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
    rating: { type: Number, enum: [4, 5], required: true },
    comment: { type: String },
    isVisible: { type: Boolean, default: true },
    roverId: { type: Schema.Types.ObjectId, ref: "Rover" },
  },
  { timestamps: true },
);

export const ServiceReview = mongoose.model<IServiceReview>(
  "ServiceReview",
  ServiceReviewSchema,
);
