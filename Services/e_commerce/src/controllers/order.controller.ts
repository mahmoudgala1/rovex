import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as OrderService from "../services/order.services";
import { PlaceOrderInput, OrderParams } from "../types/order.types";
import { MANAGEMENT_ROLES } from "../utils/permissions";
import { FLEET_MANAGMENT_ROLES } from "../utils/permissions";
import { validateAllowedUpdates } from "../helper/globalUpdateValidator";
import { publishOrder } from "../services/rabbitmq.services";

export const placeOrder = asyncHandler(
  async (
    req: Request<unknown, unknown, PlaceOrderInput>,
    res: Response,
    next: NextFunction,
  ) => {
    const user_id = (req as any).user.id;
    const company = (req as any).user.company;
    const { location, payment_method } = req.body;
    const { order, payment_data, payment_error } =
      await OrderService.placeOrderService(
        user_id,
        company,
        location,
        payment_method,
      );

    //Cash Order (Instant Success)
    if (payment_method === "Cash") {
      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: {
          order_id: order._id,
          status: order.order_status,
        },
      });
      return;
    }

    //  Card Order - Payment Gateway Failed (Soft Fail)
    if (payment_error) {
      res.status(202).json({
        success: true,
        message:
          "Order placed, but payment system is currently unavailable. Please retry via My Orders.",
        data: {
          order_id: order._id,
          payment_url: null,
          action_required: "RETRY_PAYMENT",
        },
      });
      return;
    }

    // Card Order - Success (Redirect User)
    res.status(201).json({
      success: true,
      message: "Order initialized. Proceed to payment.",
      data: {
        order_id: order._id,
        payment_data,
        status: order.order_status,
      },
    });
  },
);

export const retryPayment = asyncHandler(
  async (req: Request<OrderParams>, res: Response, next: NextFunction) => {
    const user_id = (req as any).user.id;
    const { order_id } = req.body;

    const payment_data = await OrderService.retryPaymentService(
      user_id,
      order_id,
    );

    res.status(200).json({
      success: true,
      message: "Payment link generated successfully",
      data: {
        order_id,
        // payment_url: payment_data.redirect_url
      },
    });
  },
);

export const cancelOrder = asyncHandler(
  async (req: Request<OrderParams>, res: Response, next: NextFunction) => {
    const user_id = (req as any).user.id;
    const { order_id } = req.params;

    const order = await OrderService.cancelOrderService(user_id, order_id);

    res.status(200).json({
      success: true,
      message: "order canceled successfully ",
      data: {
        order_id: order._id,
        status: order.order_status,
      },
    });
  },
);

export const GetOrderDetails = asyncHandler(
  async (req: Request<OrderParams>, res: Response, next: NextFunction) => {
    const user_id = (req as any).user.id;
    const company = (req as any).user.company;
    const role = (req as any).user.role;
    const { order_id } = req.params;
    console.log("controoler", order_id);
    const order = await OrderService.getOrderDetailsService(
      user_id,
      order_id,
      company,
      role,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  },
);

export const GetAllOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id = (req as any).user.id;
    const company = (req as any).user.company;
    const role = (req as any).user.role;
    const {data, pagination} = await OrderService.getAllOrdersService(
      user_id,
      company,
      role,
      req.query,
    );

    res.status(200).json({
      success: true,
      results: data.length,
      data: {data:data,pagination:pagination},
    });
  },
);

export const updateOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id = (req as any).user.id;
    const company = (req as any).user.company;
    const role = (req as any).user.role;
    const { order_id } = req.params;

    // allowed updates based on role
    let allowedUpdates: string[] = [];
    let query: object = {};
    if (role === "customer") {
      allowedUpdates = ["location"];
      query = { _id: order_id, user: user_id };
    } else if (
      MANAGEMENT_ROLES.includes(role) ||
      FLEET_MANAGMENT_ROLES.includes(role)
    ) {
      allowedUpdates = ["location", "order_status", "payment_status"];
      query = MANAGEMENT_ROLES.includes(role)
        ? { _id: order_id, company: company }
        : { _id: order_id };
    }

    const updateBody = validateAllowedUpdates(req.body, allowedUpdates);

    const updatedOrder = await OrderService.updateOrderService(
      user_id,
      company,
      updateBody,
      query,
    );

    // push the order to the queue if the new status is ready_to_dispacth
    if (updateBody.order_status === "ready_to_dispatch" && updatedOrder) {
      await publishOrder({
        _id: updatedOrder._id,
        company: updatedOrder.company,
        order_status: updatedOrder.order_status,
        location: updatedOrder.location,
      });
    }

    res.status(200).json({
      success: true,
      message: "order updated sucessfully",
      data: updatedOrder,
    });
  },
);
