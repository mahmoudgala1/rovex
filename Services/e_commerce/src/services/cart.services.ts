import { IProduct, IUser,ICart,ICartItem } from "../types";
import CartModel from "../models/cart.model";
import { validateCoupon } from "../helper/validate_coupon.helper";
import CouponModel from "../models/coupon.models";
import { AppError } from "../utils/AppError";
import { calculateCartStats } from "../helper/calculate.cart.price.helper";
import { Types } from "mongoose";

export const addToCartService = async (product: IProduct, userId: string, quantity?: number) => {
    let cart = await CartModel.findOne({ user: userId });

    // 1. Manage Items (Push or Increment)
    if (!cart) {
        cart = await CartModel.create({
            user: userId,
            cartItems: [{ product: product._id, price: product.price,quantity: quantity || 1 }],
            totalCartPrice: product.price // Init value, will be fixed by calc below
        });
    } else {
        const productIndex = cart.cartItems.findIndex(
            (item: ICartItem) => item.product == product._id
        );

        if (productIndex > -1) {
            cart.cartItems[productIndex].quantity += quantity || 1;
        } else {
            cart.cartItems.push({
                product: product._id,
                price: product.price,
                quantity: quantity || 1
            } as ICartItem);
        }
    }



    if (cart.coupon_id) {
        try {
            const coupon = await CouponModel.findById(cart.coupon_id);
            
          
            calculateCartStats(cart, coupon); // Updates totalCartPrice & Discount
            
            // Now validate the result
            await validateCoupon(coupon!.code, cart.totalCartPrice);
            
        } catch (error) {
            // Validation failed? Recalculate WITHOUT coupon
            calculateCartStats(cart, null);
        }
    } else {
        // No coupon? Just calculate totals
        calculateCartStats(cart, null);
    }

    await cart.save();
    return cart;
};

export const deleteItemFromCartService = async (productId: string, userId: string) => {
    const cart = await CartModel.findOne({ user: userId });
    
    if (!cart) {
        throw new AppError("Cart not found for the user", 404);
    }

    const productIndex = cart.cartItems.findIndex(
        (item: ICartItem) => item.product == productId
    );

    if (productIndex > -1) {
        // Product exists -> remove item
        cart.cartItems.splice(productIndex, 1);
    } else {
        throw new AppError("Product not found in cart", 404);
    }
        // Recalculate totals & handle coupon if exists
    
    if (cart.coupon_id) {
        try {
            const coupon = await CouponModel.findById(cart.coupon_id);

            calculateCartStats(cart, coupon);

            // Now validate the result
            await validateCoupon(coupon!.code, cart.totalCartPrice);

        } catch (error) {
            // 3. Validation Failed? Remove coupon & Recalculate
            calculateCartStats(cart, null);
        }
    } else {
        // No coupon? Just calculate base totals
        calculateCartStats(cart, null);
    }
  

    await cart.save();
    return cart;
};

export const clearCartService = async(userId: string) =>{

    //find cart for the logged user     
    const cart = await CartModel.findOne({user:userId});
    if(!cart)
    {   
        throw new Error("Cart not found for the user");
    }       
    cart.cartItems = [];
    cart.totalCartPrice = 0;      
        await cart.save();
        return cart;        
}   

export const getCartService = async(userId: string) =>{

    //find cart for the logged user     
    const cart = await CartModel.findOne({user:userId}).populate('cartItems.product');
    if(!cart)
    {   
        return []; // Return empty array if no cart found
    }       

        return cart;
}       

    