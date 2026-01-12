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
import CartModel from "../models/cart.model";
import { validateCoupon } from "../helper/validate_coupon.helper";
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
      (req as any).user._id,
      (req as any).user.vendor_id
    ); //logged admin id

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
  if (updatedBody.discount) {
    throw new Error("You cannot update discount value");
  }
  const coupon = await updateCouponService(
    code,
    (req as any).user._id,
    (req as any).user.vendor_id,
    updatedBody
  ); //logged admin id

  res.status(200).json({
    success: true,

    message: "Coupon updated successfully",
    data: coupon,
  });
});

export const getAllCoupons = asyncHandler(async (req: Request, res, next) => {
  const coupons = await getAllCouponsService((req as any).user.vendor_id); //logged admin id
  res.status(200).json({
    success: true,

    message: "Coupons retrieved successfully",
    data: coupons,
  });
});

export const applyCoupon = asyncHandler(async (req: Request, res, next) => {
  const { couponCode } = req.body;
  const user_id = (req as any).user!._id;

  const updatedCart = await applyCouponToCartService(user_id, couponCode);

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
  const updatedCart = await removeCouponFromCartService((req as any).user!._id);

  res.status(200).json({
    success: true,
    message: "Coupon removed successfully",
    data: { cart: updatedCart },
  });
});
