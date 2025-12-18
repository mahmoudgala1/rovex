
import mongoose, { Schema, Model } from 'mongoose';
import { ICoupon } from '../types/index';

const couponSchema = new Schema<ICoupon>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'User',  
        required: [true, 'Coupon user is required'] ,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',  
        required: [true, 'Coupon vendor is required'] ,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const coupon_model: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', couponSchema);
export default coupon_model;