import { Request, Response } from "express";
import { stripe, config } from "../config/stripe.config";
import { Logger } from "../utils/logger";
import { successResponse, errorResponse } from "../utils/response";
import Stripe from "stripe";
import RabbitMQPublisher from "../services/rabbitmq.service";
import { Company } from "../models/company.model";

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
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
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
    this.logger.info(`-----------------------------------`);
    this.logger.info(`Webhook received: ${event.type}`);
    const stripeAccountId = event.account;
    console.log(stripeAccountId);

    try {
      switch (event.type) {
        case "account.updated": {
          const account = event.data.object as Stripe.Account;
          await this.handleAccountUpdated(stripeAccountId!, account);
          break;
        }

        // Payment Events
        case "payment_intent.succeeded":
          await this.onPaymentIntentSucceeded(event.data.object);
          break;

        case "payment_intent.payment_failed":
          break;

        case "payment_intent.canceled":
          break;

        // Charge Events
        case "charge.succeeded":
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

        default:
          this.logger.info(`Unhandled event type: ${event.type}`);
          this.logger.info(`-----------------------------------`);
      }

      return successResponse(res, { received: true });
    } catch (error) {
      this.logger.error("Error processing webhook:", error);
      return errorResponse(res, "Webhook processing failed", 500);
    }
  };

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

  private async handleAccountUpdated(
    stripeAccountId: string,
    account: Stripe.Account,
  ) {
    const isFullyOnboarded =
      account.charges_enabled &&
      account.details_submitted &&
      account.requirements?.currently_due?.length === 0 &&
      account.requirements?.past_due?.length === 0;

    await Company.findOneAndUpdate(
      { "stripe.accountId": stripeAccountId },
      {
        "stripe.chargesEnabled": account.charges_enabled,
        "stripe.payoutsEnabled": account.payouts_enabled,
        "stripe.detailsSubmitted": account.details_submitted,
        "stripe.capabilities.cardPayments": account.capabilities?.card_payments,
        "stripe.capabilities.transfers": account.capabilities?.transfers,
        ...(isFullyOnboarded && {
          "stripe.onboardingComplete": true,
          "stripe.onboardedAt": new Date(),
        }),
        status: account.charges_enabled ? "active" : "restricted",
      },
      { new: true },
    );

    this.logger.info(
      `Account updated: ${stripeAccountId} — charges: ${account.charges_enabled} | onboarded: ${isFullyOnboarded}`,
    );
  }

  private isSubscriptionPayment(pi: Stripe.PaymentIntent): boolean {
    const orderRef = (pi as any).payment_details?.order_reference as
      | string
      | null;
    if (orderRef && orderRef.startsWith("in_")) {
      return true;
    }

    if (pi.description?.toLowerCase().includes("subscription")) {
      return true;
    }

    return false;
  }

  private async onPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    const isSubscription = this.isSubscriptionPayment(pi);

    if (isSubscription) {
      const invoiceId = (pi as any).payment_details?.order_reference;

      this.logger.info(
        `✅ Subscription payment succeeded: ${pi.id} | invoice: ${invoiceId}`,
      );
      return;
    }
    const orderId = pi.metadata?.orderId;
    const amount = pi.amount / 100;
    const currency = pi.currency;
    const customerId = pi.customer as string | null;

    this.logger.info(
      `✅ One-time payment succeeded: ${pi.id} | orderId: ${orderId} | ${amount} ${currency}`,
    );

    // TODO: Update payment + activate order
    // await paymentRepo.update({ stripePaymentIntentId: pi.id, status: 'succeeded' });
    orderId &&
      (await RabbitMQPublisher.publishEvent("update-order", {
        orderId: orderId,
      }));
  }

  private async onPaymentIntentFailed(pi: Stripe.PaymentIntent) {
    const isSubscription = this.isSubscriptionPayment(pi);

    if (isSubscription) {
      const invoiceId = (pi as any).payment_details?.order_reference;
      this.logger.error(
        `❌ Subscription payment failed: ${pi.id} | invoice: ${invoiceId} → handled by invoice.payment_failed`,
      );
      return;
    }

    const orderId = pi.metadata?.orderId;
    const failureCode = pi.last_payment_error?.code;
    const failureMessage = pi.last_payment_error?.message;

    this.logger.error(
      `❌ One-time payment failed: ${pi.id} | orderId: ${orderId} | ${failureCode}: ${failureMessage}`,
    );

    // TODO: Update payment + fail order
  }

  private async onPaymentIntentCreated(pi: Stripe.PaymentIntent) {
    const isSubscription = this.isSubscriptionPayment(pi);

    if (isSubscription) {
      this.logger.info(`🆕 PI created (subscription): ${pi.id} → skip`);
      return;
    }

    this.logger.info(
      `🆕 PI created (one-time): ${pi.id} | orderId: ${pi.metadata?.orderId}`,
    );
    // TODO: Create payment record as "pending"
  }

  private async onPaymentIntentCanceled(pi: Stripe.PaymentIntent) {
    const isSubscription = this.isSubscriptionPayment(pi);

    this.logger.info(
      `Payment canceled: ${pi.id} | type: ${isSubscription ? "subscription" : "one-time"}`,
    );

    if (isSubscription) return; // handled elsewhere

    const orderId = pi.metadata?.orderId;
    // TODO: Cancel order
    // if (orderId) await orderRepo.cancel(orderId);
  }
}
