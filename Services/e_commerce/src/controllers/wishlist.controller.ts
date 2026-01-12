import { Request, Response, NextFunction } from 'express';
import * as WishlistService from '../services/wishlist.service'; 
import { asyncHandler } from '../utils/asyncHandler';
import { API_Response } from '../types/response.types';
import { AddToWishlistInput, RemoveItemParams } from '../types/whishlist.types';


export const addToWishlist = asyncHandler(
    async (
        req: Request<unknown, API_Response, AddToWishlistInput, unknown>,
        res: Response,
        next: NextFunction
    ) => {
       
        const userId = (req as any).user.id; 
        
        const updatedWishlist = await WishlistService.addToWishlistService(userId, req.body.productId);

        res.status(200).json({
            success: true,
            message: "Item added to wishlist scuccessfully",
            data: updatedWishlist
        });
    }
);

// Remove Item from Wishlist
export const removeFromWishlist = asyncHandler(
    async (
        req: Request<RemoveItemParams, API_Response, AddToWishlistInput, unknown>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        
        const updatedWishlist = await WishlistService.removeFromWishlistService(userId, req.body.productId);

        res.status(200).json({
            success: true,
            message: "Item removed from wishlist",
            data: updatedWishlist
        });
    }
);

// Get Wishlist
export const getWishlist = asyncHandler(
    async (
        req: Request<unknown, API_Response, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        
        const wishlist = await WishlistService.getWishlistService(userId, false);

        res.status(200).json({
            success: true,
            message: "Wishlist retrieved successfully",
            data: wishlist
        });
    }
);

export const clearWishlist = asyncHandler(
    async (
        req: Request<unknown, API_Response, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        const clearedWishlist = await WishlistService.clearWishlistService(userId);

        res.status(200).json({  
            success: true,
            message: "Wishlist cleared successfully",
            data: clearedWishlist
        });
    }   
);

export const getWishlistIds = asyncHandler(
    async (
        req: Request<unknown, API_Response, unknown, unknown>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        const wishlist = await WishlistService.getWishlistService(userId, true);

        res.status(200).json({
            success: true,
            message: "Wishlist IDs retrieved successfully",
            data: wishlist
        });
    }
);