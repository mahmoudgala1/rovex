import { SubscriptionPlan, SubscriptionStatus } from "../grpc/clients/subscription.client";
import Stripe from "stripe";

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    paused: "PAUSED",
  };
  return map[status] ?? "UNKNOWN";
}

export function extractUserId(
  obj: Stripe.Subscription | Stripe.Invoice | Stripe.Checkout.Session,
): string | null {
  const meta = (obj as any).metadata as Record<string, string> | null;
  return meta?.userId ?? meta?.user_id ?? null;
}

export function mapPriceToPlan(
  priceId: string,
  nickname?: string | null,
): SubscriptionPlan {
  if (nickname) {
    const n = nickname.toLowerCase();
    if (n.includes("business")) return "ENTERPRISE";
    if (n.includes("professional")) return "PRO";
    if (n.includes("basic")) return "BASIC";
  }
  return "BASIC";
}

export function getSubscriptionPeriodEnd(sub: Stripe.Subscription): number {
  return (
    sub.items?.data?.[0]?.current_period_end ??
    Math.floor(Date.now() / 1000) + 2592000
  );
}

export function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  const parent = invoice.parent as any;
  return parent?.subscription_details?.subscription ?? null;
}

export function getInvoiceUserId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as any;
  return (
    extractUserId(invoice) ??
    parent?.subscription_details?.metadata?.userId ??
    parent?.subscription_details?.metadata?.user_id ??
    null
  );
}

export function getInvoicePlan(invoice: Stripe.Invoice): SubscriptionPlan {
  const lineItem = invoice.lines?.data?.[0] as any;

  const priceId =
    lineItem?.pricing?.price_details?.price ?? lineItem?.price?.id ?? "";

  const nickname = lineItem?.price?.nickname ?? null;

  return mapPriceToPlan(priceId, nickname);
}

export function getInvoicePeriodEnd(invoice: Stripe.Invoice): number {
  const lineItem = invoice.lines?.data?.[0] as any;
  return lineItem?.period?.end ?? Math.floor(Date.now() / 1000);
}