
import { Document, Types } from "mongoose";
import { BaseDocument } from "./base.types";
export interface IUser {
    id: string;          
    role: string;        
    type: string;        
    company: string;  
}

export interface IProduct extends BaseDocument
{
    title:string;
    price:number;
    description:string;
    discount:number;
    images_URL:string[];
    stock:number;
    is_active:boolean;
    company:Types.ObjectId;
    created_at:Date;


}
export interface IQueryString {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: any; 
}

export interface ICartItem {
  product:string; // Reference to product ID
  quantity:number;
  price:number;

}
export interface ICart extends BaseDocument{
  cartItems:ICartItem[];
  totalCartPrice: number;
  totalPriceAfterDiscount?: number;
  user: string; // Reference to User ID
  createdAt: Date;
  updatedAt: Date;
  coupon_id: string| null; // Reference to Coupon ID
}

export interface ICoupon extends BaseDocument{
  code:string;
  discount:number;
  expiration_date:Date;  
  created_at: Date;
  company: string; // Reference to vendor ID
  user: string; // Reference to User ID
  is_deleted:boolean;
  max_usage: number;    
  used_count: number;   
  min_purchase_amount: number;
  discount_type: 'percentage' | 'fixed';
}