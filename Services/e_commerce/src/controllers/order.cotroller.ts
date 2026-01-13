import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as OrderService from '../services/order.services';
import { PlaceOrderInput, OrderParams } from '../types/order.types';
import mongoose from 'mongoose';

export const placeOrder = asyncHandler(
    async (
        req: Request<unknown, unknown, PlaceOrderInput>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        const { items, shippingAddress, paymentMethod } = req.body;

        // Call Service
        const { order, paymentData, paymentError } = await OrderService.placeOrderService(
            userId,
            items,
            shippingAddress,
            paymentMethod
        );

        // SCENARIO 1: Cash Order (Instant Success)
        if (paymentMethod === 'Cash') {
            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: {
                    orderId: order._id,
                    status: order.orderStatus
                }
            });
            return;
        }

        // SCENARIO 2: Card Order - Payment Gateway Failed (Soft Fail)
        // We saved the order, but couldn't get the payment link.
        if (paymentError) {
            res.status(202).json({ // 202 Accepted = "We took the order, but processing isn't done"
                success: true,
                message: "Order placed, but payment system is currently unavailable. Please retry via My Orders.",
                data: {
                    orderId: order._id,
                    paymentUrl: null,
                    actionRequired: "RETRY_PAYMENT"
                }
            });
            return;
        }

        // SCENARIO 3: Card Order - Success (Redirect User)
        res.status(201).json({
            success: true,
            message: "Order initialized. Proceed to payment.",
            data: {
                orderId: order._id,
                paymentUrl: paymentData?.redirectUrl // URL from Stripe/Paymob
            }
        });
    }
);


export const retryPayment = asyncHandler(
    async (
        req: Request<OrderParams>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        const { orderId } = req.params;

        const paymentData = await OrderService.retryPaymentService(userId, orderId);

        res.status(200).json({
            success: true,
            message: "Payment link generated successfully",
            data: {
                orderId,
                paymentUrl: paymentData.redirectUrl
            }
        });
    }
);


export const getMyOrders = asyncHandler(
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        
        const orders = await OrderService.getMyOrdersService(userId);

        res.status(200).json({
            success: true,
            results: orders.length,
            data: orders,
        });
    }
);


export const cancelOrder = asyncHandler(
    async (
        req: Request<OrderParams>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        const { orderId } = req.params;
     
        const order = await OrderService.cancelOrderService(userId, orderId);

        res.status(200).json({
            success: true,
            message: 'Order cancelled and stock restored',
            data: {
                orderId: order._id,
                status: order.orderStatus
            },
        });
    }
);

export const GetOrderDetails = asyncHandler(
    async (
        req: Request<OrderParams>,
        res: Response,
        next: NextFunction
    ) => {
        const userId = (req as any).user.id;
        const { orderId } = req.params;
        const order = await OrderService.getOrderDetailsService(userId, orderId);

        res.status(200).json({
            success: true,
            data: order,
        });
    }
);
export const GetAllOrders = asyncHandler(
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const orders = await OrderService.getAllOrdersService();

        res.status(200).json({
            success: true,
            results: orders.length,
            data: orders,
        });
    }
);  