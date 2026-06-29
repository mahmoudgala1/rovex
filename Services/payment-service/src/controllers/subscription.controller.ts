import { Response } from "express";
import { SubscriptionService } from "../services/subscription.service";
import { AuthenticatedRequest } from "../types/stripe.types";
import { successResponse, errorResponse } from "../utils/response";
import { Logger } from "../utils/logger";

export class SubscriptionController {
  private subscriptionService: SubscriptionService;
  private logger: Logger;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.logger = new Logger("SubscriptionController");
  }

  createCheckout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { priceId, trialDays, successUrl, cancelUrl } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      if (!stripeCustomerId || !priceId) {
        return errorResponse(res, "Customer ID and Price ID are required", 400);
      }

      const session = await this.subscriptionService.createCheckoutSession(
        stripeCustomerId,
        priceId,
        trialDays,
        successUrl,
        cancelUrl,
      );

      this.logger.info(`Checkout session created: ${session.id}`);
      return successResponse(
        res,
        {
          sessionId: session.id,
          url: session.url,
        },
        "Checkout session created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating checkout:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  createSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { priceId, trialDays, metadata } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;
      metadata.userId = (req as any).user.company;

      if (!stripeCustomerId || !priceId) {
        return errorResponse(res, "Customer ID and Price ID are required", 400);
      }

      const subscription = await this.subscriptionService.createSubscription(
        stripeCustomerId,
        { priceId, trialDays, metadata },
      );

      const dto = this.subscriptionService.mapSubscriptionToDTO(subscription);

      this.logger.info(`Subscription created: ${subscription.id}`);
      return successResponse(
        res,
        dto,
        "Subscription created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating subscription:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  getSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscriptionId = String(req.params.subscriptionId);

      const subscription =
        await this.subscriptionService.getSubscription(subscriptionId);

      const dto = this.subscriptionService.mapSubscriptionToDTO(subscription);

      return successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error fetching subscription:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  updateSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscriptionId = String(req.params.subscriptionId);
      const { priceId } = req.body;

      if (!priceId) {
        return errorResponse(res, "Price ID is required", 400);
      }

      const subscription = await this.subscriptionService.updateSubscription(
        subscriptionId,
        priceId,
      );
      const dto = this.subscriptionService.mapSubscriptionToDTO(subscription);

      this.logger.info(`Subscription updated: ${subscriptionId}`);
      return successResponse(res, dto, "Subscription updated successfully");
    } catch (error) {
      this.logger.error("Error updating subscription:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscriptionId = String(req.params.subscriptionId);
      const { immediately } = req.body;

      const subscription = await this.subscriptionService.cancelSubscription(
        subscriptionId,
        immediately,
      );
      const dto = this.subscriptionService.mapSubscriptionToDTO(subscription);

      this.logger.info(`Subscription cancelled: ${subscriptionId}`);
      return successResponse(res, dto, "Subscription cancelled successfully");
    } catch (error) {
      this.logger.error("Error cancelling subscription:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  resumeSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscriptionId = String(req.params.subscriptionId);

      const subscription =
        await this.subscriptionService.resumeSubscription(subscriptionId);

      const dto = this.subscriptionService.mapSubscriptionToDTO(subscription);

      this.logger.info(`Subscription resumed: ${subscriptionId}`);
      return successResponse(res, dto, "Subscription resumed successfully");
    } catch (error) {
      this.logger.error("Error resuming subscription:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  listSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit } = req.query;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      const subscriptions = await this.subscriptionService.listSubscriptions(
        stripeCustomerId as string,
        limit ? parseInt(limit as string) : 10,
      );

      const dto =
        this.subscriptionService.mapSubscriptionListToDTO(subscriptions);

      return successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error listing subscriptions:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  createPortalSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { returnUrl } = req.body;
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      if (!stripeCustomerId) {
        return errorResponse(res, "Customer ID is required", 400);
      }

      const session = await this.subscriptionService.createBillingPortalSession(
        stripeCustomerId,
        returnUrl,
      );

      this.logger.info(
        `Billing portal session created for: ${stripeCustomerId}`,
      );
      return successResponse(
        res,
        { url: session.url },
        "Portal session created successfully",
        201,
      );
    } catch (error) {
      this.logger.error("Error creating portal session:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  listInvoices = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const stripeCustomerId = (req as any).user.stripeCustomerId;
      const { limit } = req.query;

      const invoices = await this.subscriptionService.listInvoices(
        stripeCustomerId,
        limit ? parseInt(limit as string) : 10,
      );
      const dto = this.subscriptionService.mapInvoiceListToDTO(invoices);

      successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error listing invoices:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getInvoice = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const invoiceId = String(req.params.invoiceId);

      const invoice = await this.subscriptionService.getInvoice(invoiceId);
      const dto = this.subscriptionService.mapInvoiceToDTO(invoice);

      successResponse(res, dto);
    } catch (error) {
      this.logger.error("Error fetching invoice:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };

  getUpcomingInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stripeCustomerId = (req as any).user.stripeCustomerId;

      const invoice =
        await this.subscriptionService.getUpcomingInvoice(stripeCustomerId);

      return successResponse(res, invoice);
    } catch (error) {
      this.logger.error("Error fetching upcoming invoice:", error);
      if ((error as any).code === "invoice_upcoming_none") {
        errorResponse(res, "No upcoming invoice found for this customer", 404);
        return;
      }
      return errorResponse(res, (error as Error).message, 500);
    }
  };
}
