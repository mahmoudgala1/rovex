import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { productModel } from "../models/product.models";
import { AppError } from "../utils/AppError";


export const productIsActive = (isCustomer: boolean) => {
  
    return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        
        let product;

        // SCENARIO A: Admin/Company Owner (Must own the product)
        if (!isCustomer) {
            const companyId = (req as any).company || (req as any).user?.company;
            
            product = await productModel.findOne({ 
                _id: req.params.id, 
                company: companyId 
            });
        } 
        // SCENARIO B: Public Customer (Product must be active)
        else {
            product = await productModel.findOne({ _id: req.body.productId });
            
            // For customers, if it's inactive, pretend it doesn't exist
            if (product && !product.is_active) {
                return next(new AppError("Product not found", 404));
            }
        }

        // Common Check: Did we find anything?
        if (!product) {
            return next(new AppError("Product not found or access denied", 404));
        }

        // Attach to request and move on
        (req as any).product = product;
        next();
    });
};