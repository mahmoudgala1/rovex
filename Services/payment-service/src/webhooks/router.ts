import Stripe from "stripe";
import { stripe, config } from "../config/stripe.config";
import { Logger } from "../utils/logger";

const logger = new Logger("StripeWebhookHandler");

// ─── Handlers ────────────────────────────────────────────
import { handleCheckoutCompleted } from "./handlers/checkout.handler";
import {
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleInvoiceUpcoming,
} from "./handlers/invoice.handler";
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleTrialWillEnd,
  handleSubscriptionPaused,
  handleSubscriptionResumed,
} from "./handlers/subscription.handler";

// ─── Event Router ─────────────────────────────────────────
const eventHandlers: Partial<
  Record<Stripe.Event["type"], (e: any) => Promise<void>>
> = {
  // ── Checkout ──
  "checkout.session.completed": handleCheckoutCompleted,

  // ── Invoice ──
  "invoice.paid": handleInvoicePaid,
  "invoice.payment_failed": handleInvoicePaymentFailed,
  "invoice.upcoming": handleInvoiceUpcoming,

  // ── Subscription lifecycle ──
  "customer.subscription.created": handleSubscriptionCreated,
  "customer.subscription.updated": handleSubscriptionUpdated,
  "customer.subscription.deleted": handleSubscriptionDeleted,
  "customer.subscription.trial_will_end": handleTrialWillEnd,
  "customer.subscription.paused": handleSubscriptionPaused,
  "customer.subscription.resumed": handleSubscriptionResumed,
};

// ─── Main Webhook Handler (Express raw body required) ────
import { Request, Response } from "express";

export async function stripeWebhookHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const sig = req.headers["stripe-signature"];
  const connectAccountId = req.headers["stripe-account"] as string | undefined;
  const webhookSecret = connectAccountId
    ? config.webhookSecretConnectedAccounts
    : config.webhookSecret;

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  try {
    event = stripe.webhooks.constructEvent(
      rawBody, // Must be raw Buffer — use express.raw()
      sig,
      webhookSecret,
    );
  } catch (err: any) {
    logger.error("Webhook signature verification failed", {
      message: err.message,
    });
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  logger.info(`Received webhook: ${event.type}`, { eventId: event.id });

  const handler = eventHandlers[event.type];

  if (!handler) {
    logger.warn(`Unhandled webhook event: ${event.type}`);
    res.json({ received: true, handled: false });
    return;
  }

  try {
    await handler(event);
    res.json({ received: true, handled: true });
  } catch (err: any) {
    logger.error(`Handler failed for ${event.type}`, { error: err.message });
    // Return 200 to prevent Stripe from retrying if error is non-recoverable
    // Return 500 if you want Stripe to retry (e.g. gRPC user-service was down)
    res.status(500).json({ error: "Handler failed", retry: true });
  }
}
