import { Schema, model, Document, Types } from "mongoose";

export interface IFCMToken extends Document {
  userId: Types.ObjectId;
  fcmToken: string;
  platform?: "android" | "ios" | "web";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FCMTokenSchema = new Schema<IFCMToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fcmToken: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web"],
      default: "android",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

FCMTokenSchema.index({ userId: 1, platform: 1 }, { unique: true });

FCMTokenSchema.index({ fcmToken: 1 }, { unique: true });

export const FCMTokenModel = model<IFCMToken>("FCMToken", FCMTokenSchema);
