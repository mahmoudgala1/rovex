import { createCouponBody,deleteCouponParams} from "../types/cart.types";
import {asyncHandler} from "../utils/asyncHandler";
import { Request } from "express";
import { API_Response } from "../types/response.types";
import { createCouponService, updateCouponService,getAllCouponsService} from "../services/coupon.servics";

export const createCoupon = asyncHandler(
    async(
        req: Request<unknown,API_Response,createCouponBody,unknown>,
        res 
        ,next)=>{
            const {code, discount, expiration_date} = req.body; 
            const coupon =  await createCouponService(code, discount, expiration_date, (req as any).user._id, (req as any).user.vendor_id); //logged admin id

            res.status(200).json(
                { 
                success: true,
                message: "Coupon created successfully",
                data: coupon });            
        }
    
)   
 

export const updateCoupon = asyncHandler(
    async(
        req: Request,
        res 
        ,next)=>{
            const code = req.params.code;
            const updatedBody = req.body;
            if(updatedBody.discount )
                 {
                    throw new Error("You cannot update discount value");
                }
            const coupon =  await updateCouponService(code, (req as any).user._id, (req as any).user.vendor_id,updatedBody); //logged admin id
            
            res.status(200).json(
                { 
                success: true,      
                    
                message: "Coupon updated successfully",
                data: coupon });            
        }   
)   

export const getAllCoupons = asyncHandler(
    async(
        req: Request,
        res 
        ,next)=>{

            const coupons =  await getAllCouponsService((req as any).user.vendor_id); //logged admin id
            res.status(200).json(
                { 
                success: true,      
                    
                message: "Coupons retrieved successfully",
                data: coupons });            
        }   
)   