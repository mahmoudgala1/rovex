import Stripe from "stripe";
import { stripe } from "../../config/stripe.config";
import { subscriptionGrpcClient } from "../../grpc/clients/subscription.client";
import {
  mapPriceToPlan,
  extractUserId,
  getSubscriptionPeriodEnd,
} from "../../utils/mappers";
import { Logger } from "../../utils/logger";

const logger = new Logger("CheckoutHandler");

export async function handleCheckoutCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
): Promise<void> {
  const session = event.data.object;
  if (session.mode !== "subscription") return;

  const userId = extractUserId(session) ?? session.client_reference_id;
  if (!userId) {
    logger.error("checkout.session.completed: no userId", {
      sessionId: session.id,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
    { expand: ["items.data.price"] },
  );

  const priceItem = subscription.items.data[0];
  const plan = mapPriceToPlan(priceItem.price.id, priceItem.price.nickname);
  const isTrial = subscription.status === "trialing";

  logger.webhook("checkout.session.completed", userId);

  await subscriptionGrpcClient.grantAccess({
    user_id: userId,
    plan,
    stripe_customer_id: session.customer as string,
    stripe_sub_id: subscription.id,
    current_period_end: getSubscriptionPeriodEnd(subscription),
    is_trial: isTrial,
  });
}
