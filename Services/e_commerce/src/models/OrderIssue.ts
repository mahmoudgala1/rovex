import mongoose, { Document, Schema } from "mongoose";

export type IssueStatus = "open" | "in_progress" | "resolved";
export type IssueType =
  | "rover_slow"
  | "package_damaged"
  | "wrong_delivery"
  | "rover_malfunction"
  | "other";

export interface IOrderIssue extends Document {
  userId: String;
  companyId: String;
  orderId: String;
  userName: string;
  roverId?: String;
  roverName?: string;
  rating: 1 | 2 | 3;
  issueType: IssueType;
  comment?: string;
  images: string[];
  status: IssueStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ISSUE_TYPES: IssueType[] = [
  "rover_slow",
  "package_damaged",
  "wrong_delivery",
  "rover_malfunction",
  "other",
];

const OrderIssueSchema = new Schema<IOrderIssue>(
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
    roverId: { type: String, ref: "Rover" },
    roverName: { type: String },
    rating: { type: Number, enum: [1, 2, 3], required: true },
    issueType: { type: String, enum: ISSUE_TYPES, required: true },
    comment: { type: String },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: "Max 5 images allowed",
      },
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    adminNote: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export const OrderIssue = mongoose.model<IOrderIssue>(
  "OrderIssue",
  OrderIssueSchema,
);
