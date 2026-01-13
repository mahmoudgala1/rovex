import mongoose, { Schema, Document, Types } from 'mongoose';
import { IOrder } from '../types/order.types';

const OrderSchema = new Schema<IOrder>(
  {
    user: { type:String, ref: 'User', required: true },
    items: [
      {
        product_id: { type: String, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      phone: { type: String, required: true },
    },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Card'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed',"Refund_Pending","Refunded"], default: 'Pending' },
    orderStatus: {
      type: String,
      enum: ['PendingPayment', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'PendingPayment',
    },
    paymentId: { type: String }, // ID from the Payment Microservice
    expiresAt: { type: Date },  // When this order should be auto-cancelled if unpaid
  },
  { timestamps: true }
);

// Index for the Cron Job (Makes queries super fast)
OrderSchema.index({ orderStatus: 1, expiresAt: 1 });

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);