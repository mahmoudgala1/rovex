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

      const dto = this.paymentMethodService.mapPaymentMethodToDTO(
        paymentMethod!,
      );

      this.logger.info(`Payment method created: ${paymentMethod.id}`);
      successResponse(res, dto, "Payment method created successfully", 201);
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
      const { paymentMethodId } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      if (!paymentMethodId || !stripeCustomerId) {
        errorResponse(
          res,
          "Payment method ID and customer ID are required",
          400,
        );
        return;
      }

      const paymentMethod = await this.paymentMethodService.attachPaymentMethod(
        paymentMethodId,
        stripeCustomerId,
      );

      const dto = this.paymentMethodService.mapPaymentMethodToDTO(
        paymentMethod!,
      );

      this.logger.info(
        `Payment method attached: ${paymentMethodId} to ${stripeCustomerId}`,
      );
      successResponse(res, dto, "Payment method attached successfully");
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

      const dto = this.paymentMethodService.mapPaymentMethodToDTO(
        paymentMethod!,
      );

      this.logger.info(`Payment method detached: ${paymentMethodId}`);
      successResponse(res, dto, "Payment method detached successfully");
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

      const dto =
        this.paymentMethodService.mapPaymentMethodToDTO(paymentMethod);

      successResponse(res, dto);
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
      const stripeCustomerId = (req as any).user.stripeCustomerId;
      const { type, limit } = req.query;

      const paymentMethods = await this.paymentMethodService.listPaymentMethods(
        stripeCustomerId,
        type as string,
        limit ? parseInt(limit as string) : 10,
      );

      const dto =
        this.paymentMethodService.mapPaymentMethodListToDTO(paymentMethods);

      successResponse(res, dto);
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

      const dto = this.paymentMethodService.mapPaymentMethodToDTO(
        paymentMethod!,
      );

      this.logger.info(`Payment method updated: ${paymentMethodId}`);
      successResponse(res, dto, "Payment method updated successfully");
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
      const { paymentMethodId } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      if (!stripeCustomerId || !paymentMethodId) {
        errorResponse(
          res,
          "Customer ID and payment method ID are required",
          400,
        );
        return;
      }

      const customer = await this.paymentMethodService.setDefaultPaymentMethod(
        stripeCustomerId,
        paymentMethodId,
      );

      this.logger.info(
        `Default payment method set for customer: ${stripeCustomerId}`,
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
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      const paymentMethod =
        await this.paymentMethodService.getDefaultPaymentMethod(
          stripeCustomerId,
        );
      const dto = this.paymentMethodService.mapPaymentMethodToDTO(
        paymentMethod!,
      );

      if (!paymentMethod) {
        successResponse(res, null, "No default payment method found");
        return;
      }

      successResponse(res, dto);
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
      const { paymentMethodTypes } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      if (!stripeCustomerId) {
        errorResponse(res, "Customer ID is required", 400);
        return;
      }

      const setupIntent = await this.paymentMethodService.createSetupIntent(
        stripeCustomerId,
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
      const { type, card, billingDetails, setAsDefault } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      if (!stripeCustomerId || !type) {
        errorResponse(
          res,
          "Customer ID and payment method type are required",
          400,
        );
        return;
      }

      const result =
        await this.paymentMethodService.createAndAttachPaymentMethod(
          stripeCustomerId,
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
