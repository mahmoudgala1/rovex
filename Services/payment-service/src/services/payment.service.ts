import Stripe from "stripe";
import { stripe } from "../config/stripe.config";
import { CreatePaymentDTO } from "../types/stripe.types";
import { PaymentDTO } from "../mappers/stripe.mapper";
import { Company } from "../models/company.model";

export class PaymentService {
  private async getStripeAccount(companyId: string): Promise<{
    accountId: string;
    platformFeePercent: number;
  }> {
    const company = await Company.findOne({ companyId });

    if (!company?.stripe?.accountId) {
      throw new Error(`Company ${companyId} has no connected Stripe account`);
    }

    if (!company.stripe.chargesEnabled) {
      throw new Error(
        `Company ${companyId} Stripe account is not fully activated`,
      );
    }

    return {
      accountId: company.stripe.accountId,
      platformFeePercent: company.platformFeePercent,
    };
  }

  async createPaymentIntent(
    companyId: string,
    data: CreatePaymentDTO,
    stripeCustomerId: string,
  ) {
    const { accountId, platformFeePercent } =
      await this.getStripeAccount(companyId);

    const applicationFeeAmount = Math.round(
      data.amount * (platformFeePercent / 100),
    );

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: data.amount,
        currency: data.currency,
        customer: stripeCustomerId,
        description: data.description,
        metadata: data.metadata,
        application_fee_amount: applicationFeeAmount,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      },
      { stripeAccount: accountId },
    );

    return paymentIntent;
  }

  async getPaymentIntent(companyId: string, paymentIntentId: string) {
    const { accountId } = await this.getStripeAccount(companyId);

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { stripeAccount: accountId },
    );

    return paymentIntent;
  }

  async confirmPaymentIntent(
    companyId: string,
    paymentIntentId: string,
    paymentMethodId: string,
  ) {
    const { accountId } = await this.getStripeAccount(companyId);

    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: paymentMethodId,
        off_session: true,
      },
      { stripeAccount: accountId },
    );

    return paymentIntent;
  }

  async cancelPaymentIntent(companyId: string, paymentIntentId: string) {
    const { accountId } = await this.getStripeAccount(companyId);

    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
      stripeAccount: accountId,
    });

    return paymentIntent;
  }

  async createRefund(
    companyId: string,
    paymentIntentId: string,
    amount?: number,
  ) {
    const { accountId } = await this.getStripeAccount(companyId);

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount,
        refund_application_fee: amount ? false : true,
      },
      { stripeAccount: accountId },
    );

    return refund;
  }

  async listPaymentIntents(
    companyId: string,
    stripeCustomerId?: string,
    limit: number = 10,
  ) {
    const { accountId } = await this.getStripeAccount(companyId);

    const paymentIntents = await stripe.paymentIntents.list(
      {
        customer: stripeCustomerId,
        limit,
      },
      { stripeAccount: accountId },
    );

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
          orderId: p.metadata?.orderId,
          includeClientSecret: false,
        }),
      ),
      hasMore: apiList.has_more,
    };
  }
}
