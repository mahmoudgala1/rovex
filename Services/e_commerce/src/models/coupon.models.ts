
import mongoose, { Schema, Model } from 'mongoose';
import { ICoupon } from '../types/index';
import { nanoid } from 'nanoid';
const generateID = () => `COUPON_${nanoid(15)}`;
const couponSchema = new Schema<ICoupon>(
  {
     _id: { 
        type: String, 
        default: generateID 
    },
    code: {
      type: String,
      trim: true,
      required: [true, 'Coupon name is required'],
      unique: true,
      uppercase: true, 
    },
    expiration_date: {
      type: Date,
      required: [true, 'Coupon expiration date is required'],
    },
    discount: {
      type: Number,
      required: [true, 'Coupon discount value is required'],
    },
    user: {
      type: String,
      ref: 'User',  
        required: [true, 'user ID is required'] ,
    },
    company: {
      type: String,
      ref: 'Vendor',  
        required: [true, 'Company ID  is required'] ,
    },
    is_deleted: {
      type: Boolean,// Soft delete flag
      default: false,
    },
    max_usage: {
        type: Number,// Maximum number of times the coupon can be used
        default: 100 
    },
    used_count: {
        type: Number,
        default: 0 // Number of times the coupon has been used
    },
    min_purchase_amount: {
        type: Number,
        default: 0   // Minimum purchase amount to apply the coupon
    },
    discount_type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'fixed'
    },
  
  },
    { timestamps: true }
);

const coupon_model: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', couponSchema);
export default coupon_model;