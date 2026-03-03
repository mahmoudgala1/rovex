import { createCouponBody, deleteCouponParams } from "../types/cart.types";
import { asyncHandler } from "../utils/asyncHandler";
import { NextFunction, Request } from "express";
import { API_Response } from "../types/response.types";
import {
  createCouponService,
  updateCouponService,
  getAllCouponsService,
  applyCouponToCartService,
  removeCouponFromCartService,
} from "../services/coupon.servics";
import { AppError } from "../utils/AppError";

export const createCoupon = asyncHandler(
  async (
    req: Request<unknown, API_Response, createCouponBody, unknown>,
    res,
    next
  ) => {
    const { code, discount, expiration_date, max_usage, min_purchase_amount } =
      req.body;
    const coupon = await createCouponService(
      code,
      discount,
      expiration_date,
      max_usage,
      min_purchase_amount,
      (req as any).user.id,
      (req as any).user.company
    ); 

    res.status(200).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  }
);

export const updateCoupon = asyncHandler(async (req: Request, res, next) => {
  const code = req.params.code;
  const updatedBody = req.body;
  if(updatedBody.discount || updatedBody.discount_type || updatedBody.code)
  {
    throw new AppError("you can not update discount ,discount_type or code",400);
  }
  const allowedUpdates = ['expiration_date', 'max_usage','is_deleted','min_purchase_amount'];
  const updates: any = {};
    Object.keys(updatedBody).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            updates[key] = (updatedBody as any)[key];
        }
    });

    // 3. Force the security overrides
    updates.user =  (req as any).user.id;
    const company =  (req as any).user.company;
  const coupon = await updateCouponService(
    code,
    company,
    updates
  ); 

  res.status(200).json({
    success: true,

    message: "Coupon updated successfully",
    data: coupon,
  });
});

export const getAllCoupons = asyncHandler(async (req: Request, res, next) => {
  const queryString = req.query

  const coupons = await getAllCouponsService((req as any).user.company, queryString); //logged admin id
  res.status(200).json({
    success: true,
    message: "Coupons retrieved successfully",
    data: coupons,
  });
});

export const applyCoupon = asyncHandler(async (req: Request, res, next) => {
  const { coupon_code } = req.body;
  const user_id = (req as any).user!.id;
  const company = (req as any).user.company;

  const updatedCart = await applyCouponToCartService(user_id, coupon_code, company);

  // 3. Send Response
  res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    data: {
      cart: updatedCart,
    },
  });
});

export const removeCoupon = asyncHandler(async (req: Request, res) => {
  const updatedCart = await removeCouponFromCartService((req as any).user!.id);

  res.status(200).json({
    success: true,
    message: "Coupon removed successfully",
    data: { cart: updatedCart },
  });
});
