import coupon_model from "../models/coupon.models";
import {UpdateCouponInput} from "../types/cart.types";
import { AppError } from "../utils/AppError";
import { QueryBuilder } from "../utils/queryBuilder";
import CartModel from "../models/cart.model";  
import { validateCoupon } from "../helper/validate_coupon.helper";  
import { calculateCartStats } from "../helper/calculate.cart.price.helper";
import { IQueryString } from "../types";


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
    company :string,
     updatedBody:UpdateCouponInput
    ) =>{

        const coupon = await coupon_model.findOneAndUpdate({code,company}, {...updatedBody}, {new:true});
        if(!coupon)
        {
            throw new AppError("coupon not found or access denied",404);
        }
        return coupon;
    }       

export const getAllCouponsService = async(
     company:string,
     queryString:IQueryString
    ) =>{

         const queryObj = { ...queryString };
        
              if (queryObj.title && typeof queryObj.title === 'string') {
                  queryObj.title = { $regex: queryObj.title, $options: 'i' };
              }
              const features = new QueryBuilder(coupon_model.find({ is_deleted: false, company: company }), queryObj)
                    .filter()
                    .sort()
                    .limitFields()
                    .paginate();
              
                    await features.countTotal();
           
            const allCoupons = await features.modelQuery;
            const pagination = features.getPaginationMetadata();
            
           return {
            data: allCoupons,
            pagination,
          };
    }           


export const applyCouponToCartService = async (userId:string, couponCode: string,company:string) => {
    // 1. Find Cart
    const cart = await CartModel.findOne({ user: userId });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }

    // 2. Validate Coupon
    // Checks expiration, min purchase amount, etc.
    const coupon = await validateCoupon(couponCode, company,cart.totalCartPrice);

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
    if(!cart.coupon_id  )
    {
        throw new AppError("There is no coupon Applied ",404);
    }

    // 1. Remove Coupon Fields
    cart.coupon_id = null;
    cart.totalPriceAfterDiscount = undefined;

    // 2. Save
    await cart.save();
    return cart;
};