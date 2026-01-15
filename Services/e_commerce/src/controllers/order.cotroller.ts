import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as OrderService from '../services/order.services';
import { PlaceOrderInput, OrderParams } from '../types/order.types';

export const placeOrder = asyncHandler(
    async (
        req: Request<unknown, unknown, PlaceOrderInput>,
        res: Response,
        next: NextFunction
    ) => {
        const user_id = (req as any).user.id; 
        const company = (req as any).user.company; 
        const { shipping_address, payment_method } = req.body; 
        const { order, payment_data, payment_error } = await OrderService.placeOrderService(
            user_id,
            company,
            shipping_address,
            payment_method
        );

        //Cash Order (Instant Success)
        if (payment_method === 'Cash') {
            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: {
                    order_id: order._id,
                    status: order.order_status 
                }
            });
            return;
        }

        //  Card Order - Payment Gateway Failed (Soft Fail)
        if (payment_error) {
            res.status(202).json({ 
                success: true,
                message: "Order placed, but payment system is currently unavailable. Please retry via My Orders.",
                data: {
                    order_id: order._id,
                    payment_url: null,
                    action_required: "RETRY_PAYMENT"
                }
            });
            return;
        }

        // Card Order - Success (Redirect User)
        res.status(201).json({
            success: true,
            message: "Order initialized. Proceed to payment.",
            data: {
                order_id: order._id,
                // ✅ This must be uncommented so the frontend can redirect the user
               // payment_url: payment_data?.redirect_url 
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
        const user_id = (req as any).user.id;
        const { order_id } = req.body; 

        const payment_data = await OrderService.retryPaymentService(user_id, order_id);

        res.status(200).json({
            success: true,
            message: "Payment link generated successfully",
            data: {
                order_id,
               // payment_url: payment_data.redirect_url
            }
        });
    }
);

export const cancelOrder = asyncHandler(
    async (
        req: Request<OrderParams>,
        res: Response,
        next: NextFunction
    ) => {
        const user_id = (req as any).user.id;
        const { order_id } = req.body;
     
        const order = await OrderService.cancelOrderService(user_id, order_id);

        res.status(200).json({
            success: true,
            message: 'Order cancelled and stock restored',
            data: {
                order_id: order._id,
                status: order.order_status
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
        const user_id = (req as any).user.id;
        const { order_id } = req.body;
        const order = await OrderService.getOrderDetailsService(user_id, order_id);

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
        const user_id = (req as any).user.id;
        const company = (req as any).user.company
        const isCustomer= (req as any).user.role =="customer"? true:false
        const orders = await OrderService.getAllOrdersService(user_id, company, isCustomer);

        res.status(200).json({
            success: true,
            results: orders.length,
            data: orders,
        });
    }
);