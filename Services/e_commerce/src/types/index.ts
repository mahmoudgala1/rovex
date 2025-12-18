
import { Document, Types } from "mongoose";

export interface IUser extends Document
{
    name:string;
    email:string;
    role:'user'|"admin";
    password:string;


}
export interface IProduct extends Document
{
    title:string;
    price:number;
    description:string;
    discount:number;
    images_URL:string[];
    stock:number;
    is_active:boolean;
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
  product:Types.ObjectId; // Reference to product ID
  quantity:number;
  price:number;

}
export interface ICart extends Document{
  cartItems:ICartItem[];
  totalCartPrice: number;
  totalPriceAfterDiscount?: number;
  user: Types.ObjectId; // Reference to User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoupon extends Document{
  code:string;
  discount:number;
  expiration_date:Date;  
  created_at: Date;
  vendor: Types.ObjectId; // Reference to vendor ID
  user: Types.ObjectId; // Reference to User ID
  is_deleted:boolean;
}