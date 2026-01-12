import { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { GetPtoductParams } from "../types/products.types";
import { API_Response } from "../types/response.types";
import { productModel } from "../models/product.models";
import { AppError } from "../utils/AppError";
import { IProduct } from "../types";
import mongoose from "mongoose";

export const productIsActive = asyncHandler(
    async(
        req: Request<GetPtoductParams,API_Response,unknown,unknown>,
        res 
        ,next)=>{
            console.log("productIsActive middleware called");
            
            const companyId = (req as any).company || (req as any).user.company;
            console.log(companyId);

        
           const product=  await productModel.findOne({ 
                _id: req.params.id, 
                company: companyId})

           if(!product || !product.is_active)
           {
                throw new AppError("product not found or you do not have access to it",404)
           }
           (req as any).product = product;

           return  next()
        }
    
)