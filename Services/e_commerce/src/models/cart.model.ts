import mongoose, { Schema, Model } from 'mongoose';
import { ICart } from "../types/index";
import { generateId } from "../utils/helpers";

const cartSchema = new Schema<ICart>(
  {
    _id: {
      type: String,
      default: () => generateId("CART"),
    },
    cartItems: [
      {
        product: {
          type: String,
          ref: "Product",
          required: true,
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
      type: String,
      ref: "User",
      required: true,
    },
    coupon_id: {
      type: String,
      ref: "Coupon",
      default: null,
    },
  },
  { timestamps: true }
);

const CartModel: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);
export default CartModel;