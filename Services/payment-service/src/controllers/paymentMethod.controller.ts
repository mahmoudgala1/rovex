import { Response } from "express";
import { PaymentMethodService } from "../services/paymentMethod.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";

export class PaymentMethodController {
  private paymentMethodService: PaymentMethodService;
  private logger: Logger;

  constructor() {
    this.paymentMethodService = new PaymentMethodService();
    this.logger = new Logger("PaymentMethodController");
  }

  createPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { type, card, billingDetails, metadata } = req.body;

      if (!type) {
        errorResponse(res, "Payment method type is required", 400);
        return;
      }

      const paymentMethod = await this.paymentMethodService.createPaymentMethod(
        {
          type,
          card,
          billingDetails,
          metadata,
        },
      );

      this.logger.info(`Payment method created: ${paymentMethod.id}`);
      successResponse(
        res,
        paymentMethod,
        "Payment method created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  attachPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { paymentMethodId, customerId } = req.body;

      if (!paymentMethodId || !customerId) {
        errorResponse(
          res,
          "Payment method ID and customer ID are required",
          400,
        );
        return;
      }

      const paymentMethod = await this.paymentMethodService.attachPaymentMethod(
        paymentMethodId,
        customerId,
      );

      this.logger.info(
        `Payment method attached: ${paymentMethodId} to ${customerId}`,
      );
      successResponse(
        res,
        paymentMethod,
        "Payment method attached successfully",
      );
    } catch (error) {
      this.logger.error("Error attaching payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  detachPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const paymentMethodId = String(req.params.paymentMethodId);

      const paymentMethod =
        await this.paymentMethodService.detachPaymentMethod(paymentMethodId);

      this.logger.info(`Payment method detached: ${paymentMethodId}`);
      successResponse(
        res,
        paymentMethod,
        "Payment method detached successfully",
      );
    } catch (error) {
      this.logger.error("Error detaching payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const paymentMethodId = String(req.params.paymentMethodId);

      const paymentMethod =
        await this.paymentMethodService.getPaymentMethod(paymentMethodId);

      successResponse(res, paymentMethod);
    } catch (error) {
      this.logger.error("Error fetching payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  listPaymentMethods = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const customerId = String(req.params.customerId);
      const { type, limit } = req.query;

      const paymentMethods = await this.paymentMethodService.listPaymentMethods(
        customerId,
        type as string,
        limit ? parseInt(limit as string) : 10,
      );

      successResponse(res, paymentMethods);
    } catch (error) {
      this.logger.error("Error listing payment methods:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  updatePaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const paymentMethodId = String(req.params.paymentMethodId);
      const { billingDetails, card, metadata } = req.body;

      const paymentMethod = await this.paymentMethodService.updatePaymentMethod(
        paymentMethodId,
        { billingDetails, card, metadata },
      );

      this.logger.info(`Payment method updated: ${paymentMethodId}`);
      successResponse(
        res,
        paymentMethod,
        "Payment method updated successfully",
      );
    } catch (error) {
      this.logger.error("Error updating payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  setDefaultPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { customerId, paymentMethodId } = req.body;

      if (!customerId || !paymentMethodId) {
        errorResponse(
          res,
          "Customer ID and payment method ID are required",
          400,
        );
        return;
      }

      const customer = await this.paymentMethodService.setDefaultPaymentMethod(
        customerId,
        paymentMethodId,
      );

      this.logger.info(
        `Default payment method set for customer: ${customerId}`,
      );
      successResponse(res, customer, "Default payment method set successfully");
    } catch (error) {
      this.logger.error("Error setting default payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getDefaultPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const customerId = String(req.params.customerId);

      const paymentMethod =
        await this.paymentMethodService.getDefaultPaymentMethod(customerId);

      if (!paymentMethod) {
        successResponse(res, null, "No default payment method found");
        return;
      }

      successResponse(res, paymentMethod);
    } catch (error) {
      this.logger.error("Error fetching default payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  createSetupIntent = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { customerId, paymentMethodTypes } = req.body;

      if (!customerId) {
        errorResponse(res, "Customer ID is required", 400);
        return;
      }

      const setupIntent = await this.paymentMethodService.createSetupIntent(
        customerId,
        paymentMethodTypes,
      );

      this.logger.info(`Setup intent created: ${setupIntent.id}`);
      successResponse(
        res,
        {
          setupIntentId: setupIntent.id,
          clientSecret: setupIntent.client_secret,
          status: setupIntent.status,
        },
        "Setup intent created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating setup intent:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  confirmSetupIntent = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const setupIntentId = String(req.params.setupIntentId);
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        errorResponse(res, "Payment method ID is required", 400);
        return;
      }

      const setupIntent = await this.paymentMethodService.confirmSetupIntent(
        setupIntentId,
        paymentMethodId,
      );

      this.logger.info(`Setup intent confirmed: ${setupIntentId}`);
      successResponse(res, setupIntent, "Setup intent confirmed successfully");
    } catch (error) {
      this.logger.error("Error confirming setup intent:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getSetupIntent = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const setupIntentId = String(req.params.setupIntentId);

      const setupIntent =
        await this.paymentMethodService.getSetupIntent(setupIntentId);
      successResponse(res, setupIntent);
    } catch (error) {
      this.logger.error("Error fetching setup intent:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  cancelSetupIntent = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const setupIntentId = String(req.params.setupIntentId);

      const setupIntent =
        await this.paymentMethodService.cancelSetupIntent(setupIntentId);

      this.logger.info(`Setup intent cancelled: ${setupIntentId}`);
      successResponse(res, setupIntent, "Setup intent cancelled successfully");
    } catch (error) {
      this.logger.error("Error cancelling setup intent:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  createAndAttachPaymentMethod = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { customerId, type, card, billingDetails, setAsDefault } = req.body;

      if (!customerId || !type) {
        errorResponse(
          res,
          "Customer ID and payment method type are required",
          400,
        );
        return;
      }

      const result =
        await this.paymentMethodService.createAndAttachPaymentMethod(
          customerId,
          { type, card, billingDetails, setAsDefault },
        );

      this.logger.info(
        `Payment method created and attached: ${result.paymentMethod.id}`,
      );
      successResponse(
        res,
        result,
        "Payment method created and attached successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating and attaching payment method:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  validateCard = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const { cardNumber, expMonth, expYear, cvc } = req.body;

      if (!cardNumber || !expMonth || !expYear || !cvc) {
        errorResponse(res, "All card details are required", 400);
        return;
      }

      const validation = await this.paymentMethodService.validateCard(
        cardNumber,
        expMonth,
        expYear,
        cvc,
      );

      if (validation.valid) {
        successResponse(res, { valid: true }, "Card is valid");
      } else {
        errorResponse(res, validation.errors.join(", "), 400);
      }
    } catch (error) {
      this.logger.error("Error validating card:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };
}
