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
      const { customerId, priceId, trialDays, successUrl, cancelUrl } =
        req.body;

      if (!customerId || !priceId) {
        return errorResponse(res, "Customer ID and Price ID are required", 400);
      }

      const session = await this.subscriptionService.createCheckoutSession(
        customerId,
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
      const { customerId, priceId, trialDays, metadata } = req.body;

      if (!customerId || !priceId) {
        return errorResponse(res, "Customer ID and Price ID are required", 400);
      }

      const subscription = await this.subscriptionService.createSubscription(
        customerId,
        { priceId, trialDays, metadata },
      );

      const response: any = {
        subscriptionId: subscription.id,
        status: subscription.status,
      };

      if (subscription.status === "incomplete") {
        const latestInvoice = subscription.latest_invoice as any;
        const paymentIntent = latestInvoice?.payment_intent;

        if (paymentIntent?.client_secret) {
          response.clientSecret = paymentIntent.client_secret;
          response.requiresAction = true;
        }
      }

      this.logger.info(`Subscription created: ${subscription.id}`);
      return successResponse(
        res,
        response,
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

      return successResponse(res, subscription);
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

      this.logger.info(`Subscription updated: ${subscriptionId}`);
      return successResponse(
        res,
        subscription,
        "Subscription updated successfully",
      );
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

      this.logger.info(`Subscription cancelled: ${subscriptionId}`);
      return successResponse(
        res,
        subscription,
        "Subscription cancelled successfully",
      );
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

      this.logger.info(`Subscription resumed: ${subscriptionId}`);
      return successResponse(
        res,
        subscription,
        "Subscription resumed successfully",
      );
    } catch (error) {
      this.logger.error("Error resuming subscription:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  listSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId, limit } = req.query;

      const subscriptions = await this.subscriptionService.listSubscriptions(
        customerId as string,
        limit ? parseInt(limit as string) : 10,
      );

      return successResponse(res, subscriptions);
    } catch (error) {
      this.logger.error("Error listing subscriptions:", error);
      return errorResponse(res, (error as Error).message, 500);
    }
  };

  createPortalSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId, returnUrl } = req.body;

      if (!customerId) {
        return errorResponse(res, "Customer ID is required", 400);
      }

      const session = await this.subscriptionService.createBillingPortalSession(
        customerId,
        returnUrl,
      );

      this.logger.info(`Billing portal session created for: ${customerId}`);
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

  getUpcomingInvoice = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = String(req.params.customerId);

      const invoice =
        await this.subscriptionService.getUpcomingInvoice(customerId);

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

  listInvoices = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const customerId = String(req.params.customerId);
      const { limit } = req.query;

      const invoices = await this.subscriptionService.listInvoices(
        customerId,
        limit ? parseInt(limit as string) : 10,
      );

      successResponse(res, invoices);
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
      successResponse(res, invoice);
    } catch (error) {
      this.logger.error("Error fetching invoice:", error);
      errorResponse(res, (error as Error).message, 500);
    }
  };
}
