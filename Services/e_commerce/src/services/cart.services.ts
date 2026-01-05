import { IProduct, IUser,ICart,ICartItem } from "../types";
import CartModel from "../models/cart.model";
import { validateCoupon } from "../helper/validate_coupon.helper";
import CouponModel from "../models/coupon.models";
import { AppError } from "../utils/AppError";
import { calculateCartStats } from "../helper/calculate.cart.price.helper";

export const addToCartService = async (product: IProduct, user: IUser) => {
    let cart = await CartModel.findOne({ user: user._id });
    
    // 1. Manage Items (Push or Increment)
    if (!cart) {
        cart = await CartModel.create({
            user: user._id,
            cartItems: [{ product: product._id, price: product.price }],
            totalCartPrice: product.price // Init value, will be fixed by calc below
        });
    } else {
        const productIndex = cart.cartItems.findIndex(
            (item: ICartItem) => item.product.toString() === product._id.toString()
        );

        if (productIndex > -1) {
            cart.cartItems[productIndex].quantity += 1;
        } else {
            cart.cartItems.push({
                product: product._id,
                price: product.price,
                quantity: 1
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

export const deleteItemFromCartService = async (productId: string, user: IUser) => {
    const cart = await CartModel.findOne({ user: user._id });
    
    if (!cart) {
        throw new AppError("Cart not found for the user", 404);
    }

    const productIndex = cart.cartItems.findIndex(
        (item: ICartItem) => item.product.toString() === productId
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

export const clearCartService = async(user:IUser) =>{

    //find cart for the logged user     
    const cart = await CartModel.findOne({user:"64a7f0f2c2a62b6f4d5e8b9a"})
    if(!cart)
    {   
        throw new Error("Cart not found for the user");
    }       
    cart.cartItems = [];
    cart.totalCartPrice = 0;      
        await cart.save();
        return cart;        
}   

export const getCartService = async(user:IUser) =>{

    //find cart for the logged user     
    const cart = await CartModel.findOne({user:"64a7f0f2c2a62b6f4d5e8b9a"}).populate('cartItems.product');
    if(!cart)
    {   
        throw new Error("Cart not found for the user");
    }       

        return cart;
}       

    