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
    user:string,
    company:string
    ) =>{

    const coupon = await coupon_model.create(
        {code, 
            discount,
            expiration_date, 
            max_usage, 
            min_purchase_amount, 
            user, 
            company}); 
        return coupon;
}       

    

export const updateCouponService = async(
    code:string,
     user:string,
     company:string,
     updatedBody:UpdateCouponInput
    ) =>{

        const coupon = await coupon_model.findOneAndUpdate({code, company}, {...updatedBody,user}, {new:true});
        return coupon;
    }       

export const getAllCouponsService = async(
     company:string
    ) =>{
        const coupons = await coupon_model.find({company, is_deleted:false});
        return coupons;
    }           


export const applyCouponToCartService = async (userId:string, couponCode: string) => {
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


export const removeCouponFromCartService = async (userId:string) => {
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