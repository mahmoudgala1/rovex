import { Document } from "mongoose";

export interface IUser extends Document
{
    name:string;
    rmail:string;
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
