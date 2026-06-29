import Stripe from "stripe";
import { subscriptionGrpcClient } from "../../grpc/clients/subscription.client";
import {
  mapStripeStatus,
  mapPriceToPlan,
  getSubscriptionPeriodEnd,
} from "../../utils/mappers";
import { Logger } from "../../utils/logger";

const logger = new Logger("SubscriptionHandler");

function getUserIdFromSub(sub: Stripe.Subscription): string | null {
  return (
    (sub.metadata as Record<string, string | undefined>)?.userId ??
    (sub.metadata as Record<string, string | undefined>)?.user_id ??
    null
  );
}

function getPlanFromSub(sub: Stripe.Subscription) {
  const priceItem = sub.items.data[0];
  return mapPriceToPlan(priceItem.price.id, priceItem.price.nickname);
}

export async function handleSubscriptionCreated(
  event: Stripe.CustomerSubscriptionCreatedEvent,
): Promise<void> {

  const sub = event.data.object;
  const userId = getUserIdFromSub(sub);

  if (!userId) {
    logger.warn("subscription.created: no userId in metadata", {
      subId: sub.id,
    });
    return;
  }

  const plan = getPlanFromSub(sub);
  const status = mapStripeStatus(sub.status);

  logger.webhook("customer.subscription.created", userId);

  if (sub.status === "active" || sub.status === "trialing") {
    await subscriptionGrpcClient.grantAccess({
      user_id: userId,
      plan,
      stripe_customer_id:
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_sub_id: sub.id,
      current_period_end: getSubscriptionPeriodEnd(sub),
      is_trial: sub.status === "trialing",
    });
  } else {
    await subscriptionGrpcClient.updateSubscription({
      user_id: userId,
      plan,
      status,
      stripe_sub_id: sub.id,
      current_period_end: getSubscriptionPeriodEnd(sub),
    });
  }
}

export async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent,
): Promise<void> {
  const sub = event.data.object;
  const prevAttrs = event.data
    .previous_attributes as Partial<Stripe.Subscription>;
  const userId = getUserIdFromSub(sub);

  if (!userId) {
    logger.warn("subscription.updated: no userId", { subId: sub.id });
    return;
  }

  const plan = getPlanFromSub(sub);
  const status = mapStripeStatus(sub.status);

  logger.webhook("customer.subscription.updated", userId);

  if (sub.pause_collection && !prevAttrs.pause_collection) {
    logger.info("Subscription payment collection paused", { userId });
    await subscriptionGrpcClient.updateSubscription({
      user_id: userId,
      plan,
      status,
      stripe_sub_id: sub.id,
      current_period_end: getSubscriptionPeriodEnd(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
    });
    return;
  }

  if (!sub.pause_collection && prevAttrs.pause_collection) {
    logger.info("Subscription payment collection resumed", { userId });
    await subscriptionGrpcClient.updateSubscription({
      user_id: userId,
      plan,
      status,
      stripe_sub_id: sub.id,
      current_period_end: getSubscriptionPeriodEnd(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
    });
    return;
  }

  await subscriptionGrpcClient.updateSubscription({
    user_id: userId,
    plan,
    status,
    stripe_sub_id: sub.id,
    current_period_end: getSubscriptionPeriodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end,
  });
}

export async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent,
): Promise<void> {
  const sub = event.data.object;
  const userId = getUserIdFromSub(sub);

  if (!userId) {
    logger.warn("subscription.deleted: no userId", { subId: sub.id });
    return;
  }

  logger.webhook("customer.subscription.deleted", userId);

  await subscriptionGrpcClient.revokeAccess({
    user_id: userId,
    reason: "SUBSCRIPTION_DELETED",
    stripe_sub_id: sub.id,
  });
}

// export async function handleTrialWillEnd(
//   event: Stripe.CustomerSubscriptionTrialWillEndEvent,
// ): Promise<void> {
//   const sub = event.data.object;
//   const userId = getUserIdFromSub(sub);

//   if (!userId || !sub.trial_end) return;

//   const trialEnd = sub.trial_end;
//   const now = Math.floor(Date.now() / 1000);
//   const daysRemaining = Math.ceil((trialEnd - now) / 86400);

//   logger.webhook("customer.subscription.trial_will_end", userId);

//   await subscriptionGrpcClient.notifyTrialEnding({
//     user_id: userId,
//     trial_end: trialEnd,
//     days_remaining: daysRemaining,
//   });
// }

export async function handleSubscriptionPaused(
  event: Stripe.CustomerSubscriptionPausedEvent,
): Promise<void> {
  const sub = event.data.object;
  const userId = getUserIdFromSub(sub);
  if (!userId) return;

  const plan = getPlanFromSub(sub);

  logger.webhook("customer.subscription.paused", userId);

  await subscriptionGrpcClient.updateSubscription({
    user_id: userId,
    plan,
    status: "PAUSED",
    stripe_sub_id: sub.id,
    current_period_end: getSubscriptionPeriodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end,
  });
}

export async function handleSubscriptionResumed(
  event: Stripe.CustomerSubscriptionResumedEvent,
): Promise<void> {
  const sub = event.data.object;
  const userId = getUserIdFromSub(sub);
  if (!userId) return;

  const plan = getPlanFromSub(sub);

  logger.webhook("customer.subscription.resumed", userId);

  await subscriptionGrpcClient.updateSubscription({
    user_id: userId,
    plan,
    status: "ACTIVE",
    stripe_sub_id: sub.id,
    current_period_end: getSubscriptionPeriodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end,
  });
}
