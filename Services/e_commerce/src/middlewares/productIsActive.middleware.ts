import { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { GetPtoductParams } from "../types/products.types";
import { API_Response } from "../types/response.types";
import { productModel } from "../models/product.models";
import { AppError } from "../utils/AppError";
export const productIsActive = asyncHandler(
    async(
        req: Request<GetPtoductParams,API_Response,unknown,unknown>,
        res 
        ,next)=>{
        
           const product=  await productModel.findById(req.params.id)
           if(!product || !product.is_active)
           {
                throw new AppError("product not found or not active",404)
           }
           (req as any).product = product

           return  next()
        }
    
)