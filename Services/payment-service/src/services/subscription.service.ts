import { stripe } from "../config/stripe.config";
import { CreateSubscriptionDTO } from "../types/stripe.types";
import Stripe from "stripe";

export class SubscriptionService {
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    trialDays?: number,
    successUrl?: string,
    cancelUrl?: string,
  ) {
    const sessionData: any = {
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
    };

    if (trialDays && trialDays > 0) {
      sessionData.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return session;
  }

  async createSubscription(customerId: string, data: CreateSubscriptionDTO) {
    const subscriptionData: any = {
      customer: customerId,
      items: [{ price: data.priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: data.metadata,
    };

    if (data.trialDays && data.trialDays > 0) {
      subscriptionData.trial_period_days = data.trialDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);
    return subscription;
  }

  async getSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  }

  async updateSubscription(subscriptionId: string, priceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItemId = subscription.items.data[0].id;

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItemId,
          price: priceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    return updated;
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ) {
    if (immediately) {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } else {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    }
  }

  async resumeSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  }

  async listSubscriptions(customerId?: string, limit: number = 10) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit,
    });
    return subscriptions;
  }

  async createBillingPortalSession(customerId: string, returnUrl?: string) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/account`,
    });
    return session;
  }

  async getUpcomingInvoice(customerId: string) {
    const invoice = await stripe.invoices.list({
      customer: customerId,
      limit: 1,
    });
    return invoice.data[0];
  }

  async listInvoices(
    customerId: string,
    limit: number = 10,
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return invoices;
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice;
  }
}
