import { stripe } from "../config/stripe.config";
import { CreatePaymentDTO } from "../types/stripe.types";
import { CustomerService } from "./customer.service";

export class PaymentService {
  private customerService: CustomerService;
  constructor() {
    this.customerService = new CustomerService();
  }

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
}
