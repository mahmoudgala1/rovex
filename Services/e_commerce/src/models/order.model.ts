import mongoose, { Schema } from "mongoose";
import { IOrder } from "../types/order.types";
import { generateId } from "../utils/helpers";

const OrderSchema = new Schema<IOrder>(
  {
    _id: {
      type: String,
      default: () => generateId("ORDER"),
    },
    user: { type: String, ref: "User", required: true },
    company: { type: String, ref: "Company", required: true },
    roverId: { type: String },
    items: [
      {
        product_id: { type: String, ref: "Product", required: true },
        title: { type: String, required: true },
        images_URL: {
          type: [String],
          required: true,
        },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],

    location: {
      type: { type: String, default: "Point" },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    total_price: { type: Number, required: true },

    discount_amount: Number,
    final_price: Number,
    coupon: String || null,
    payment_method: {
      type: String,
      enum: ["Cash", "Card"],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refund_Pending", "Refunded"],
      default: "Pending",
    },
    order_status: {
      type: String,
      enum: [
        "PendingPayment",
        "Processing",
        "ready_to_dispatch",
        "Shipped",
        "Delivered",
        "Cancelled",
        "RETURNED",
      ],
      default: "PendingPayment",
    },
    payment_id: { type: String },
    expires_at: { type: Date },
  },
  { timestamps: true },
);

OrderSchema.index({ order_status: 1, expires_at: 1 });

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
