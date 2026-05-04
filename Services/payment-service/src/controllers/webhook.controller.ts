import { Request, Response } from "express";
import { stripe, config } from "../config/stripe.config";
import { Logger } from "../utils/logger";
import { successResponse, errorResponse } from "../utils/response";
import Stripe from "stripe";
import { WebhookEventDTO } from "../mappers/stripe.mapper";
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
          await this.handlePaymentFailed(event.data.object);
          break;

        case "payment_intent.canceled":
          await this.handlePaymentCanceled(event.data.object);
          break;

        // Charge Events
        case "charge.succeeded":
          await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
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

        // Invoice Events
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
          this.logger.info(`-----------------------------------`);
      }

      return successResponse(res, { received: true });
    } catch (error) {
      this.logger.error("Error processing webhook:", error);
      return errorResponse(res, "Webhook processing failed", 500);
    }
  };

  private async handlePaymentSuccess(paymentIntent: any) {
    this.logger.info(`✅ Payment succeeded: ${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: any) {
    this.logger.error(`❌ Payment failed: ${paymentIntent.id}`);
    // TODO: Notify customer, update order status
  }

  private async handlePaymentCanceled(paymentIntent: any) {
    this.logger.info(`Payment canceled: ${paymentIntent.id}`);
    // TODO: Update order status
  }

  private async handleChargeSucceeded(charge: Stripe.Charge) {
    this.logger.info(`✅ Charge succeeded: ${charge.id}`);
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

  private async handleAccountUpdated(
    stripeAccountId: string,
    account: Stripe.Account,
  ) {
    await Company.findOneAndUpdate(
      { "stripe.accountId": stripeAccountId },
      {
        "stripe.chargesEnabled": account.charges_enabled,
        "stripe.payoutsEnabled": account.payouts_enabled,
        "stripe.detailsSubmitted": account.details_submitted,
        status: account.charges_enabled ? "active" : "restricted",
      },
    );

    console.log(
      `Account updated: ${stripeAccountId} — chargesEnabled: ${account.charges_enabled}`,
    );
  }

  // ============================================================
  // 💳 PAYMENT INTENT HANDLERS
  // ============================================================

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
    await RabbitMQPublisher.publishEvent("update-order", {
      orderId: orderId,
    });
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

  // // ============================================================
  // // ⚡ CHARGE HANDLERS
  // // ============================================================

  // private async onChargeSucceeded(charge: Stripe.Charge) {
  //   const paymentIntentId = charge.payment_intent as string;
  //   const isSubscription =
  //     charge.invoice !== null && charge.invoice !== undefined;

  //   this.logger.info(
  //     `✅ Charge succeeded: ${charge.id} | PI: ${paymentIntentId} | type: ${isSubscription ? "subscription" : "one-time"}`,
  //   );

  //   // Update receipt URL in payment record
  //   // await paymentRepo.update({
  //   //   where: { stripePaymentIntentId: paymentIntentId },
  //   //   data: { receiptUrl: charge.receipt_url, stripeChargeId: charge.id },
  //   // });
  // }

  // private async onChargeFailed(charge: Stripe.Charge) {
  //   this.logger.error(
  //     `❌ Charge failed: ${charge.id} | ${charge.failure_code}: ${charge.failure_message}`,
  //   );
  //   // TODO: Update payment record
  // }

  // private async onChargeRefunded(charge: Stripe.Charge) {
  //   this.logger.info(
  //     `↩️ Charge refunded: ${charge.id} | refunded: ${charge.amount_refunded / 100} ${charge.currency}`,
  //   );
  //   // TODO: Update refund record
  // }

  // // ============================================================
  // // 🧾 INVOICE HANDLERS
  // // ============================================================

  // private async onInvoiceCreated(invoice: Stripe.Invoice) {
  //   this.logger.info(
  //     `Invoice created: ${invoice.id} | reason: ${invoice.billing_reason}`,
  //   );
  //   // Draft invoice → لا تعمل حاجة
  // }

  // private async onInvoiceFinalized(invoice: Stripe.Invoice) {
  //   this.logger.info(`Invoice finalized: ${invoice.id}`);
  //   // Invoice confirmed وجاهز للدفع → لا تعمل حاجة في الغالب
  // }

  // private async onInvoicePaid(invoice: Stripe.Invoice) {
  //   this.logger.info(`Invoice paid: ${invoice.id}`);
  //   // يجي بعد payment_succeeded → ممكن تتجاهله
  // }

  // private async onInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  //   const subscriptionId = invoice.subscription as string | null;
  //   const customerId = invoice.customer as string;
  //   const billingReason = invoice.billing_reason;
  //   const amount = invoice.amount_paid / 100;

  //   this.logger.info(
  //     `✅ Invoice paid: ${invoice.id} | reason: ${billingReason} | ${amount} ${invoice.currency}`,
  //   );

  //   switch (billingReason) {
  //     case "subscription_create":
  //       // أول مرة اشتراك
  //       this.logger.info(`🎉 New subscription activated: ${subscriptionId}`);
  //       // TODO: Grant access, send welcome email
  //       break;

  //     case "subscription_cycle":
  //       // تجديد شهري/سنوي
  //       this.logger.info(`🔄 Subscription renewed: ${subscriptionId}`);
  //       // TODO: Extend subscription period
  //       break;

  //     case "subscription_update":
  //       // upgrade/downgrade
  //       this.logger.info(`🔧 Subscription updated: ${subscriptionId}`);
  //       // TODO: Update plan access
  //       break;

  //     case "manual":
  //       // فاتورة يدوية
  //       this.logger.info(`📄 Manual invoice paid: ${invoice.id}`);
  //       break;

  //     default:
  //       this.logger.info(`Invoice billing_reason: ${billingReason}`);
  //   }
  // }

  // private async onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  //   const subscriptionId = invoice.subscription as string | null;
  //   const customerId = invoice.customer as string;

  //   this.logger.error(
  //     `❌ Invoice payment failed: ${invoice.id} | subscription: ${subscriptionId}`,
  //   );

  //   // TODO: Notify customer
  //   // TODO: Check attempt count
  //   // if (invoice.attempt_count >= 3) → suspend subscription
  // }

  // // ============================================================
  // // 📦 SUBSCRIPTION HANDLERS
  // // ============================================================

  // private async onSubscriptionCreated(sub: Stripe.Subscription) {
  //   this.logger.info(
  //     `✅ Subscription created: ${sub.id} | status: ${sub.status}`,
  //   );
  //   // TODO: Save subscription to DB
  // }

  // private async onSubscriptionUpdated(sub: Stripe.Subscription) {
  //   this.logger.info(`Subscription updated: ${sub.id} | status: ${sub.status}`);
  //   // TODO: Update subscription in DB
  // }

  // private async onSubscriptionDeleted(sub: Stripe.Subscription) {
  //   this.logger.info(`❌ Subscription deleted: ${sub.id}`);
  //   // TODO: Revoke access, notify customer
  // }

  // // ============================================================
  // // 👤 CUSTOMER HANDLERS
  // // ============================================================

  // private async onCustomerCreated(customer: Stripe.Customer) {
  //   this.logger.info(`Customer created: ${customer.id}`);
  //   // TODO: Sync to DB
  // }

  // private async onCustomerUpdated(customer: Stripe.Customer) {
  //   this.logger.info(`Customer updated: ${customer.id}`);
  //   // TODO: Update in DB
  // }

  // private async onCustomerDeleted(customer: Stripe.DeletedCustomer) {
  //   this.logger.info(`Customer deleted: ${customer.id}`);
  //   // TODO: Mark as deleted in DB
  // }

  // // ============================================================
  // // 🔁 IDEMPOTENCY
  // // ============================================================

  // private async isAlreadyProcessed(eventId: string): Promise<boolean> {
  //   // TODO: Check in DB
  //   // const event = await db.webhookEvent.findUnique({ where: { stripeEventId: eventId } });
  //   // return event?.processed ?? false;
  //   return false;
  // }

  // private async markAsProcessed(event: Stripe.Event): Promise<void> {
  //   // TODO: Save to DB
  //   // await db.webhookEvent.upsert({
  //   //   where: { stripeEventId: event.id },
  //   //   create: { stripeEventId: event.id, type: event.type, processed: true, processedAt: new Date() },
  //   //   update: { processed: true, processedAt: new Date() },
  //   // });
  // }
}
