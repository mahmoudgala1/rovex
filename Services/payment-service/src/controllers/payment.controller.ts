import { Response } from "express";
import { PaymentService } from "../services/payment.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";
import { Company } from "../models/company.model";

export class PaymentController {
  private paymentService: PaymentService;
  private logger: Logger;

  constructor() {
    this.paymentService = new PaymentService();
    this.logger = new Logger("PaymentController");
  }

  createPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency, description, metadata } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;
      const companyId = (req as any).user.company;
      const company = await Company.findOne({ companyId });

      if (!amount || !currency) {
        return errorResponse(res, "Amount and currency are required", 400);
      }

      const paymentIntent = await this.paymentService.createPaymentIntent(
        companyId,
        { amount, currency, description, metadata },
        stripeCustomerId,
      );

      const dto = this.paymentService.mapPaymentIntentToDTO(paymentIntent, {
        orderId: metadata.orderId,
        includeClientSecret: true,
      });

      this.logger.info(`Payment intent created: ${paymentIntent.id}`);
      return successResponse(
        res,
        { ...dto, publishableKey: company!.stripe.publishableKey },
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
      const companyId = (req as any).user.company;

      const paymentIntent = await this.paymentService.getPaymentIntent(
        companyId,
        paymentIntentId,
      );

      const dto = this.paymentService.mapPaymentIntentToDTO(paymentIntent, {
        orderId: paymentIntent.metadata.orderId,
        includeClientSecret: false,
      });

      return successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error fetching payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);
      const companyId = (req as any).user.company;
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return errorResponse(res, "Payment method ID is required", 400);
      }

      const paymentIntent = await this.paymentService.confirmPaymentIntent(
        companyId,
        paymentIntentId,
        paymentMethodId,
      );

      const dto = this.paymentService.mapPaymentIntentToDTO(paymentIntent, {
        orderId: paymentIntent.metadata.orderId,
        includeClientSecret: false,
      });

      this.logger.info(`Payment confirmed: ${paymentIntentId}`);
      return successResponse(res, dto, "Payment confirmed successfully");
    } catch (error) {
      this.logger.error("Error confirming payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  cancelPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);
      const companyId = (req as any).user.company;
      const paymentIntent = await this.paymentService.cancelPaymentIntent(
        companyId,
        paymentIntentId,
      );

      const dto = this.paymentService.mapPaymentIntentToDTO(paymentIntent, {
        orderId: paymentIntent.metadata.orderId,
        includeClientSecret: false,
      });

      this.logger.info(`Payment cancelled: ${paymentIntentId}`);
      return successResponse(res, dto, "Payment cancelled successfully");
    } catch (error) {
      this.logger.error("Error cancelling payment:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  createRefund = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentIntentId = String(req.params.paymentIntentId);
      const { amount } = req.body;
      const companyId = (req as any).user.company;

      const refund = await this.paymentService.createRefund(
        companyId,
        paymentIntentId,
        amount,
      );

      const dto = this.paymentService.mapRefundToDTO(refund);

      this.logger.info(`Refund created for payment: ${paymentIntentId}`);
      return successResponse(res, dto, "Refund created successfully", 201);
    } catch (error) {
      this.logger.error("Error creating refund:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  listPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit, starting_after } = req.query;
      const stripeCustomerId = (req as any).user.stripeCustomerId;
      const companyId = (req as any).user.company;
      const paymentIntents = await this.paymentService.listPaymentIntents(
        companyId,
        stripeCustomerId as string,
        limit ? parseInt(limit as string) : 10,
        starting_after as string,
      );

      const dto = this.paymentService.mapPaymentApiListToDTO(paymentIntents);

      return successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error listing payments:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };
}
