import Stripe from "stripe";
import { subscriptionGrpcClient } from "../../grpc/clients/subscription.client";
import {
  getInvoicePlan,
  getInvoicePeriodEnd,
  getInvoiceSubscriptionId,
  getInvoiceUserId,
} from "../../utils/mappers";
import { Logger } from "../../utils/logger";

const logger = new Logger("InvoiceHandler");

export async function handleInvoicePaid(
  event: Stripe.InvoicePaidEvent,
): Promise<void> {
  const invoice = event.data.object;

  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const userId = getInvoiceUserId(invoice);
  if (!userId) {
    logger.error("invoice.paid: no userId", { invoiceId: invoice.id });
    return;
  }

  const plan = getInvoicePlan(invoice);

  logger.webhook("invoice.paid", userId);

  await subscriptionGrpcClient.updateSubscription({
    user_id: userId,
    plan,
    status: "ACTIVE",
    stripe_sub_id: subscriptionId,
    current_period_end: getInvoicePeriodEnd(invoice),
    cancel_at_period_end: false,
  });

  await subscriptionGrpcClient.syncBillingRecord({
    user_id: userId,
    invoice_id: invoice.id,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    paid_at:
      invoice.status_transitions.paid_at ?? Math.floor(Date.now() / 1000),
    invoice_url: invoice.hosted_invoice_url ?? "",
  });
}

export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent,
): Promise<void> {
  const invoice = event.data.object;

  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const userId = getInvoiceUserId(invoice);
  if (!userId) {
    logger.error("invoice.payment_failed: no userId", {
      invoiceId: invoice.id,
    });
    return;
  }

  logger.webhook("invoice.payment_failed", userId);

  await subscriptionGrpcClient.updateSubscription({
    user_id: userId,
    plan: "BASIC",
    status: "PAST_DUE",
    stripe_sub_id: subscriptionId,
    current_period_end: getInvoicePeriodEnd(invoice),
  });
}

export async function handleInvoiceUpcoming(
  event: Stripe.InvoiceUpcomingEvent,
): Promise<void> {
  const invoice = event.data.object;

  logger.info("invoice.upcoming fired", {
    customerId:
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id,
  });
}
