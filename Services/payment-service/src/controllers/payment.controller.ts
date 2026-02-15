import { Response } from "express";
import { PaymentService } from "../services/payment.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";

export class PaymentController {
  private paymentService: PaymentService;
  private logger:Logger;

  constructor() {
    this.paymentService = new PaymentService();
    this.logger = new Logger("PaymentController");
  }

  createPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency, description, metadata, customerId } = req.body;

      if (!amount || !currency) {
        return errorResponse(res, "Amount and currency are required", 400);
      }

      const paymentIntent = await this.paymentService.createPaymentIntent(
        { amount, currency, description, metadata },
        customerId,
      );

       this.logger.info(`Payment intent created: ${paymentIntent.id}`);
      return successResponse(
        res,
        {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
        },
        "Payment intent created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  getPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);

      const paymentIntent =
        await this.paymentService.getPaymentIntent(paymentIntentId);

      return successResponse(res, paymentIntent);
    } catch (error) {
       this.logger.error("Error fetching payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };
  // ❌
  confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return errorResponse(res, "Payment method ID is required", 400);
      }

      const paymentIntent = await this.paymentService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId,
      );

      this.logger.info(`Payment confirmed: ${paymentIntentId}`);
      return successResponse(
        res,
        paymentIntent,
        "Payment confirmed successfully",
      );
    } catch (error) {
       this.logger.error("Error confirming payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  cancelPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);

      const paymentIntent =
        await this.paymentService.cancelPaymentIntent(paymentIntentId);

      this.logger.info(`Payment cancelled: ${paymentIntentId}`);
      return successResponse(
        res,
        paymentIntent,
        "Payment cancelled successfully",
      );
    } catch (error) {
      this.logger.error("Error cancelling payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  createRefund = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);
      const { amount } = req.body;

      const refund = await this.paymentService.createRefund(
        paymentIntentId,
        amount,
      );

      this.logger.info(`Refund created for payment: ${paymentIntentId}`);
      return successResponse(res, refund, "Refund created successfully", 201);
    } catch (error) {
      this.logger.error("Error creating refund:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };
  // ❌
  listPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId, limit } = req.query;

      const paymentIntents = await this.paymentService.listPaymentIntents(
        customerId as string,
        limit ? parseInt(limit as string) : 10,
      );

      return successResponse(res, paymentIntents);
    } catch (error) {
      this.logger.error("Error listing payments:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };
}
