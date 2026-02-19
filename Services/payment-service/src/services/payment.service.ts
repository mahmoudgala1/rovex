import Stripe from "stripe";
import { stripe } from "../config/stripe.config";
import { CreatePaymentDTO } from "../types/stripe.types";
import { PaymentDTO } from "../mappers/stripe.mapper";

export class PaymentService {
  async createPaymentIntent(data: CreatePaymentDTO, customerId: string) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      customer: customerId,
      description: data.description,
      metadata: data.metadata,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return paymentIntent;
  }

  async getPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      off_session: true,
    });
    return paymentIntent;
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  }

  async createRefund(paymentIntentId: string, amount?: number) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
    });
    return refund;
  }

  async listPaymentIntents(customerId?: string, limit: number = 10) {
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit,
    });
    return paymentIntents;
  }

  mapPaymentIntentToDTO(
    pi: Stripe.PaymentIntent,
    options?: {
      localId?: string;
      orderId?: string;
      includeClientSecret?: boolean;
    },
  ): PaymentDTO {
    return {
      id: options?.localId,
      stripePaymentIntentId: pi.id,
      customer: pi.customer as string,
      clientSecret: options?.includeClientSecret ? pi.client_secret : undefined,
      amount: pi.amount / 100,
      amountReceived: pi.amount_received / 100,
      currency: pi.currency,
      description: pi.description,
      paymentMethod: pi.payment_method as string,
      status: pi.status,
      canRetry: pi.status === "requires_payment_method",
      orderId: options?.orderId,
      createdAt: new Date(pi.created * 1000).toISOString(),
    };
  }

  mapRefundToDTO(refund: Stripe.Refund) {
    return {
      id: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      chargeId: refund.charge as string,
      paymentIntentId: refund.payment_intent as string,
      createdAt: new Date(refund.created * 1000).toISOString(),
    };
  }

  mapPaymentApiListToDTO(apiList: Stripe.ApiList<Stripe.PaymentIntent>): {
    items: PaymentDTO[];
    hasMore: boolean;
  } {
    return {
      items: apiList.data.map((p) =>
        this.mapPaymentIntentToDTO(p, {
          orderId: p.metadata.orderId,
          includeClientSecret: false,
        }),
      ),
      hasMore: apiList.has_more,
    };
  }
}
