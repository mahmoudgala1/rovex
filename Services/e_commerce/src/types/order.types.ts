import { Document, Types } from 'mongoose';

export interface IOrderItem {
  product_id: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    address: string;
    city: string;
    phone: string;
  };
  totalPrice: number;
  paymentMethod: 'Cash' | 'Card';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refund_Pending' | 'Refunded';
  orderStatus: 'PendingPayment' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentId?: string; // ID from the Payment Microservice
  expiresAt?: Date;   // When this order should be auto-cancelled if unpaid
}

export interface PlaceOrderInput {
    items: { product_id: string; quantity: number }[];
    shippingAddress: {
        address: string;
        city: string;
        phone: string;
    };
    paymentMethod: 'Cash' | 'Card';
}

export interface OrderParams {
    orderId: string;
}
