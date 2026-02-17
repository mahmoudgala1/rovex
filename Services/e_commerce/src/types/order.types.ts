import { Document, Types } from 'mongoose';
import { BaseDocument } from './base.types';

export interface IOrderItem {
  product_id: string; 
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder extends BaseDocument {
  user: string;
  company: string ;
  items: IOrderItem[];
  
  location: {
    type: 'Point';
    coordinates: number[]; 
  };

  total_price: number;     
  discount_amount: Number;   
  final_price: Number;
  coupon: String ;
  payment_method: 'Cash' | 'Card'; 
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refund_Pending' | 'Refunded'; 
  order_status: 'PendingPayment' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' |"RETURNED"; 
  payment_id?: string; 
  expires_at?: Date;   
}

export interface PlaceOrderInput {
    items: { product_id: string; quantity: number }[]; 
    location: {
    type: 'Point';
    coordinates: number[]; 
  };
    payment_method: 'Cash' | 'Card';
}

export interface OrderParams {
    order_id: string;
}

export type UpdateOrderInput = Partial<IOrder>;

