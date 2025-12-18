import coupon_model from "../models/coupon.models";
import {UpdateCouponInput} from "../types/cart.types";

import mongoose from "mongoose";
export const createCouponService = async(
    code:string, 
    discount:number,
     expiration_date:Date,
     user_id:mongoose.Types.ObjectId,
     vendor_id:mongoose.Types.ObjectId
    ) =>{

    //find cart for the logged user     
    const coupon = await coupon_model.create({code, discount, expiration_date, user: user_id, vendor: vendor_id}); //logged admin id

        return coupon;
}       

    

export const updateCouponService = async(
    code:string,
     user_id:mongoose.Types.ObjectId,
     vendor_id:mongoose.Types.ObjectId,
     updatedBody:UpdateCouponInput
    ) =>{

        const coupon = await coupon_model.findOneAndUpdate({code, vendor:vendor_id}, {...updatedBody,user:user_id}, {new:true});
        return coupon;
    }       

export const getAllCouponsService = async(
     vendor_id:mongoose.Types.ObjectId
    ) =>{
        const coupons = await coupon_model.find({vendor:vendor_id, is_deleted:false});
        return coupons;
    }           