import coupon_model from "../models/coupon.models";
import {UpdateCouponInput} from "../types/cart.types";
import { AppError } from "../utils/AppError";
import { ICoupon } from "../types";
import CartModel from "../models/cart.model";  
import { validateCoupon } from "../helper/validate_coupon.helper";  
import { calculateCartStats } from "../helper/calculate.cart.price.helper";

import mongoose from "mongoose";
export const createCouponService = async(
    code:string, 
    discount:number,
    expiration_date:Date,
    max_usage:number,
    min_purchase_amount:number,
    user_id:mongoose.Types.ObjectId,
    vendor_id:mongoose.Types.ObjectId
    ) =>{

    //find cart for the logged user     
    const coupon = await coupon_model.create({code, discount, expiration_date, max_usage, min_purchase_amount, user: user_id, vendor: vendor_id}); //logged admin id
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


export const applyCouponToCartService = async (userId: mongoose.Types.ObjectId, couponCode: string) => {
    // 1. Find Cart
    const cart = await CartModel.findOne({ user: userId });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    // 2. Validate Coupon
    // Checks expiration, min purchase amount, etc.
    const coupon = await validateCoupon(couponCode, cart.totalCartPrice);

    // 3. Delegate Calculation to Helper
    calculateCartStats(cart, coupon);

    // 4. Save and Return
    await cart.save();
    return cart;
};


export const removeCouponFromCartService = async (userId: mongoose.Types.ObjectId) => {
    // 1. Find Cart
    const cart = await CartModel.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found', 404);

    // 1. Remove Coupon Fields
    cart.coupon_id = null;
    cart.totalPriceAfterDiscount = undefined;

    // 2. Save
    await cart.save();
    return cart;
};