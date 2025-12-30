import mongoose, { Schema, Model } from 'mongoose';
import { ICart } from "../types/index"

const cartSchema = new Schema<ICart>(
  {
    cartItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: Number,
      },
    ],
    totalCartPrice: {
      type: Number,
      default: 0,
    },
    totalPriceAfterDiscount: {
      type: Number,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
     coupon_id: {
            type: Schema.Types.ObjectId,
            ref: 'Coupon',
            default: null
        }
  },
  { timestamps: true }
);

const CartModel: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);
export default CartModel;