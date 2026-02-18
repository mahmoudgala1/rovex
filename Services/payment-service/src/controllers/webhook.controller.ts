import { Request, Response } from "express";
import { stripe, config } from "../config/stripe.config";
import { Logger } from "../utils/logger";
import { successResponse, errorResponse } from "../utils/response";
import Stripe from "stripe";
import { WebhookEventDTO } from "../mappers/stripe.mapper";

export class WebhookController {
  private logger: Logger;
  constructor() {
    this.logger = new Logger("WebhookController");
  }

  handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return errorResponse(res, "Missing stripe-signature header", 400);
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        config.webhookSecret,
      );
    } catch (err) {
      this.logger.error("Webhook signature verification failed:", err);
      return errorResponse(
        res,
        `Webhook Error: ${(err as Error).message}`,
        400,
      );
    }

    this.logger.info(`Webhook received: ${event.type}`);

    try {
      switch (event.type) {
        // Payment Events
        case "payment_intent.succeeded":
          await this.handlePaymentSuccess(event.data.object);
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentFailed(event.data.object);
          break;

        case "payment_intent.canceled":
          await this.handlePaymentCanceled(event.data.object);
          break;

        // Subscription Events
        case "customer.subscription.created":
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        // Customer Events
        case "customer.created":
          await this.handleCustomerCreated(event.data.object);
          break;

        case "customer.updated":
          await this.handleCustomerUpdated(event.data.object);
          break;

        case "customer.deleted":
          await this.handleCustomerDeleted(event.data.object);
          break;

        default:
          this.logger.info(`Unhandled event type: ${event.type}`);
      }

      return successResponse(res, { received: true });
    } catch (error) {
      this.logger.error("Error processing webhook:", error);
      return errorResponse(res, "Webhook processing failed", 500);
    }
  };

  private async handlePaymentSuccess(paymentIntent: any) {
    this.logger.info(`✅ Payment succeeded: ${paymentIntent.id}`);
    // TODO: Update order status, send confirmation email, etc.
  }

  private async handlePaymentFailed(paymentIntent: any) {
    this.logger.error(`❌ Payment failed: ${paymentIntent.id}`);
    // TODO: Notify customer, update order status
  }

  private async handlePaymentCanceled(paymentIntent: any) {
    this.logger.info(`Payment canceled: ${paymentIntent.id}`);
    // TODO: Update order status
  }

  private async handleSubscriptionCreated(subscription: any) {
    this.logger.info(`✅ Subscription created: ${subscription.id}`);
    // TODO: Grant access to customer
  }

  private async handleSubscriptionUpdated(subscription: any) {
    this.logger.info(`Subscription updated: ${subscription.id}`);
    // TODO: Update customer access level
  }

  private async handleSubscriptionDeleted(subscription: any) {
    this.logger.info(`❌ Subscription deleted: ${subscription.id}`);
    // TODO: Revoke customer access
  }

  private async handleInvoicePaymentSucceeded(invoice: any) {
    this.logger.info(`✅ Invoice paid: ${invoice.id}`);

    if (invoice.billing_reason === "subscription_cycle") {
      this.logger.info(`Subscription renewed: ${invoice.subscription}`);
      // TODO: Extend subscription period
    }
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    this.logger.error(`❌ Invoice payment failed: ${invoice.id}`);
    // TODO: Notify customer, retry payment
  }

  private async handleCustomerCreated(customer: any) {
    this.logger.info(`Customer created: ${customer.id}`);
    // TODO: Sync to database
  }

  private async handleCustomerUpdated(customer: any) {
    this.logger.info(`Customer updated: ${customer.id}`);
    // TODO: Update database
  }

  private async handleCustomerDeleted(customer: any) {
    this.logger.info(`Customer deleted: ${customer.id}`);
    // TODO: Clean up database
  }

  private mapStripeEventToDTO(event: Stripe.Event): WebhookEventDTO {
    return {
      id: event.id,
      type: event.type,
      createdAt: new Date(event.created * 1000).toISOString(),
      data: event.data.object,
    };
  }
}
