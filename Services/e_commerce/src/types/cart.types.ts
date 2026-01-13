import { Types } from "mongoose";
import { ICoupon } from "./index";

export interface addToCartBody{
     product:Types.ObjectId; 
     quantity?:number ;
}

export interface deleteCouponParams{
    code:string;
}


type createCouponBody= ICoupon
export {createCouponBody};

export type UpdateCouponInput = Partial<createCouponBody>;

