import { Company } from "../../models/company.model";
import Stripe from "stripe";
import { Logger } from "../../utils/logger";
import RabbitMQPublisher from "../../services/rabbitmq.service";

const logger = new Logger("PaymentIntentHandler");

const isSubscriptionPayment = (pi: Stripe.PaymentIntent): boolean => {
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
};

export const handlePaymentIntentSucceeded = async (
  event: Stripe.PaymentIntentSucceededEvent,
): Promise<void> => {
  const pi = event.data.object;
  const isSubscription = isSubscriptionPayment(pi);

  if (isSubscription) {
    const invoiceId = (pi as any).payment_details?.order_reference;

    logger.info(
      `✅ Subscription payment succeeded: ${pi.id} | invoice: ${invoiceId}`,
    );
    return;
  }
  const orderId = pi.metadata?.orderId;
  const amount = pi.amount / 100;
  const currency = pi.currency;
  const customerId = pi.customer as string | null;

  logger.info(
    `✅ One-time payment succeeded: ${pi.id} | orderId: ${orderId} | ${amount} ${currency}`,
  );

  // TODO: Update payment + activate order
  // await paymentRepo.update({ stripePaymentIntentId: pi.id, status: 'succeeded' });
  orderId &&
    (await RabbitMQPublisher.publishEvent("update-order", {
      orderId: orderId,
    }));
};
