import { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { GetPtoductParams } from "../types/products.types";
import { API_Response } from "../types/response.types";
import { productModel } from "../models/product.models";
import { AppError } from "../utils/AppError";
import { IProduct ,IUser} from "../types";
import mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      product?: IProduct;
      user?: IUser;
    }
  }
}
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
           req.product = product;
           const id = new mongoose.Types.ObjectId("64a7f0f2c2a62b6f4d5e8b9a");
           req.user = { _id: id,name:"fake user", email:"fake@example.com", role:"user", password:"hashedpassword" } as IUser;
           // fake user

           return  next()
        }
    
)