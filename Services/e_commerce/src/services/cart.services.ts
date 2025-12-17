import { API_Response } from "../types/response.types";
import { Request } from "express";
import { IProduct, IUser,ICart,ICartItem } from "../types";
import CartModel from "../models/cart.models";
import mongoose from "mongoose";

export const addToCartService = async(product:IProduct, user:IUser) =>{

    //product is passed from isAcive middleware
    //logged user is passed from login 

    //find cart for the logged user

    let cart = await CartModel.findOne({user:user._id})
    if(!cart)
    {
        cart = await CartModel.create({
        user: user?._id,
        cartItems: [{ product: product._id, price: product.price }],
    });

    }
    else {
    // Cart exists
    
    const productIndex = cart.cartItems.findIndex(
      (item: ICartItem) => 
        item.product.toString() === product._id.toString()

    );

        if (productIndex > -1) {
        // Product exists -> update quantity
        const cartItem = cart.cartItems[productIndex];
        cartItem.quantity += 1;
        cart.cartItems[productIndex] = cartItem;
        } else {
        // Product not in cart -> push new item
        cart.cartItems.push({ 
            product: product._id, 
            price: product.price,
            quantity: 1 
        } as ICartItem);
    }
  }
    //Calculate Total Cart Price
 
    cart.totalCartPrice = cart.cartItems.reduce(
        (acc: number, item: ICartItem) => acc + item.quantity * item.price,
        0
    );

     await cart.save();
     return cart;

}

export const delteItemFromCartService = async(productId:string, user:IUser) =>{

    //find cart for the logged user 
    const cart = await CartModel.findOne({user:user._id})
    if(!cart)
    {   
        throw new Error("Cart not found for the user");
    }   
    const productIndex = cart.cartItems.findIndex(
        (item: ICartItem) =>
            item.product.toString() === productId
    );

    if (productIndex > -1) {        
        // Product exists -> remove item
        cart.cartItems.splice(productIndex, 1);        
    } else {
        throw new Error("Product not found in cart");
    }   
    //Calculate Total Cart Price
    cart.totalCartPrice = cart.cartItems.reduce(
        (acc: number, item: ICartItem) => acc + item.quantity * item.price,
        0
    );      
        await cart.save();
        return cart;

}

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

    