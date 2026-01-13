
import {addToCartBody} from "../types/cart.types";
import {asyncHandler} from "../utils/asyncHandler";
import { addToCartService, deleteItemFromCartService,clearCartService ,getCartService} from "../services/cart.services";
import { Request } from "express";
import { API_Response } from "../types/response.types";

export const addToCart = asyncHandler(
    async(
        req: Request<unknown,API_Response,addToCartBody,unknown>,
        res 
        ,next)=>{
            
           const cart =  await addToCartService((req as any).product, (req as any).user.id, req.body.quantity);

            res.status(200).json(
                { 
                success: true,
                message: "Product added to cart successfully",
                data: cart });            
        }
    
)   

export const delteItemFromCart = asyncHandler(
    async(
        req: Request,
        res 
        ,next)=>{
              const cart = await deleteItemFromCartService(
                req.params.id,
                (req as any).user.id
              );     

            res.status(200).json(
                { 
                success: true,              
                message: "Product deleted from cart successfully",
                data: cart });
                    
        }
    
)

export const clearCart = asyncHandler(
    async(
        req: Request,
        res 
        ,next)=>{
              const cart = await clearCartService((req as any).user.id);     

            res.status(200).json(
                { 
                success: true,              
                message: "cart is cleared successfully",
                data: null });
                    
        }
    
)

export const getCart = asyncHandler(
    async(
        req: Request,
        res 
        ,next)=>{
            const cart = await getCartService((req as any).user.id);     

            res.status(200).json(
                { 
                success: true,              
                message: "cart is returned successfully",
                data: cart });
                    
        }
    
)