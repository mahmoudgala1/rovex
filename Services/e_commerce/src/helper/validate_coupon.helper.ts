import { ICoupon } from '../types';
import CouponModel from '../models/coupon.models';
import { AppError } from "../utils/AppError";

export const validateCoupon = async (code: string,company:string, cartTotal: number): Promise<ICoupon> => {

        const coupon = await CouponModel.findOne({ 
            code: code, 
            company,
            expiration_date: { $gt:  new Date().toISOString() } // Rule: Must not be expired
        
        });
    

    if (!coupon) {
        throw new AppError('Coupon is invalid or has expired', 404);
    }

    // 2. Rule: Minimum Purchase Amount
    // "You must spend at least $50 to use this code"
    if (cartTotal < coupon.min_purchase_amount) {
        throw new AppError(
            `Coupon requires a minimum purchase of $${coupon.min_purchase_amount}`, 
            400
        );
    }

    // 3. Rule: Usage Limit (Global Scarcity)
    if (coupon.used_count >= coupon.max_usage) {
        throw new AppError('Coupon limit has been reached', 400);
    }

    return coupon;
};