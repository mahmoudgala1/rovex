import mongoose, { Document, Schema } from "mongoose";

export interface IServiceReview extends Document {
  userId: string;
  companyId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceReviewSchema = new Schema<IServiceReview>(
  {
    userId: { type: String, ref: "User", required: true },
    companyId: { type: String, ref: "Company", required: true },
    userName: { type: String, required: true },
    userAvatarUrl: { type: String },
    rating: { type: Number, enum: [4, 5], required: true },
    comment: { type: String },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ServiceReview = mongoose.model<IServiceReview>(
  "ServiceReview",
  ServiceReviewSchema,
);
