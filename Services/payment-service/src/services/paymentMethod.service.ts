import {
  PaymentMethodDTO,
  PaymentMethodListDTO,
} from "../mappers/stripe.mapper";
import { stripe } from "../config/stripe.config";
import { Company } from "../models/company.model";
import Stripe from "stripe";

export class PaymentMethodService {
  private async getStripeAccount(companyId: string): Promise<string> {
    const company = await Company.findOne({ companyId });

    if (!company?.stripe?.accountId) {
      throw new Error(`Company ${companyId} has no connected Stripe account`);
    }

    if (!company.stripe.chargesEnabled) {
      throw new Error(
        `Company ${companyId} Stripe account is not fully activated`,
      );
    }

    return company.stripe.accountId;
  }

  async attachPaymentMethod(
    companyId: string,
    paymentMethodId: string,
    stripeCustomerId: string,
  ): Promise<Stripe.PaymentMethod> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const paymentMethod = await stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: stripeCustomerId },
      { stripeAccount },
    );

    return paymentMethod;
  }

  async detachPaymentMethod(
    companyId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId, {
      stripeAccount,
    });

    return paymentMethod;
  }

  async getPaymentMethod(
    companyId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentMethodId,
      { stripeAccount },
    );

    return paymentMethod;
  }

  async listPaymentMethods(
    companyId: string,
    stripeCustomerId: string,
    type?: string,
    limit: number = 10,
  ): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const params: Stripe.PaymentMethodListParams = {
      customer: stripeCustomerId,
      limit,
      ...(type && { type: type as Stripe.PaymentMethodListParams.Type }),
    };

    const paymentMethods = await stripe.paymentMethods.list(params, {
      stripeAccount,
    });

    return paymentMethods;
  }

  async updatePaymentMethod(
    companyId: string,
    paymentMethodId: string,
    data: {
      billingDetails?: Stripe.PaymentMethodUpdateParams.BillingDetails;
      card?: Stripe.PaymentMethodUpdateParams.Card;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.PaymentMethod> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const paymentMethod = await stripe.paymentMethods.update(
      paymentMethodId,
      {
        billing_details: data.billingDetails,
        card: data.card,
        metadata: data.metadata,
      },
      { stripeAccount },
    );

    return paymentMethod;
  }

  async setDefaultPaymentMethod(
    companyId: string,
    stripeCustomerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const customer = await stripe.customers.update(
      stripeCustomerId,
      {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      },
      { stripeAccount },
    );

    return customer;
  }

  async getDefaultPaymentMethod(
    companyId: string,
    stripeCustomerId: string,
  ): Promise<Stripe.PaymentMethod | null> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const customer = (await stripe.customers.retrieve(
      stripeCustomerId,
      { expand: ["invoice_settings.default_payment_method"] },
      { stripeAccount },
    )) as Stripe.Customer;

    const defaultPm = customer.invoice_settings?.default_payment_method;

    if (defaultPm && typeof defaultPm === "object") {
      return defaultPm as Stripe.PaymentMethod;
    }

    return null;
  }

  async createSetupIntent(
    companyId: string,
    stripeCustomerId: string,
    paymentMethodTypes: string[] = ["card"],
  ): Promise<Stripe.SetupIntent> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const setupIntent = await stripe.setupIntents.create(
      {
        customer: stripeCustomerId,
        payment_method_types: paymentMethodTypes as any,
        usage: "off_session",
      },
      { stripeAccount },
    );

    return setupIntent;
  }

  async confirmSetupIntent(
    companyId: string,
    setupIntentId: string,
    paymentMethodId: string,
  ): Promise<Stripe.SetupIntent> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const setupIntent = await stripe.setupIntents.confirm(
      setupIntentId,
      { payment_method: paymentMethodId },
      { stripeAccount },
    );

    return setupIntent;
  }

  async getSetupIntent(
    companyId: string,
    setupIntentId: string,
  ): Promise<Stripe.SetupIntent> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
      stripeAccount,
    });

    return setupIntent;
  }

  async cancelSetupIntent(
    companyId: string,
    setupIntentId: string,
  ): Promise<Stripe.SetupIntent> {
    const stripeAccount = await this.getStripeAccount(companyId);

    const setupIntent = await stripe.setupIntents.cancel(setupIntentId, {
      stripeAccount,
    });

    return setupIntent;
  }

  validateCard(
    cardNumber: string,
    expMonth: number,
    expYear: number,
    cvc: string,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const cleanNumber = cardNumber.replace(/\s/g, "");

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push("Invalid card number length");
    }

    if (!/^\d+$/.test(cleanNumber)) {
      errors.push("Card number must contain only digits");
    }

    if (expMonth < 1 || expMonth > 12) {
      errors.push("Invalid expiration month");
    }

    if (expYear < new Date().getFullYear()) {
      errors.push("Card has expired");
    }

    if (cvc.length < 3 || cvc.length > 4) {
      errors.push("Invalid CVC");
    }

    return { valid: errors.length === 0, errors };
  }

  mapPaymentMethodToDTO(
    pm: Stripe.PaymentMethod,
    options?: { isDefault?: boolean },
  ): PaymentMethodDTO {
    const card = pm.card!;
    return {
      id: pm.id,
      customer: pm.customer as string,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
    };
  }

  mapPaymentMethodListToDTO(
    apiList: Stripe.ApiList<Stripe.PaymentMethod>,
  ): PaymentMethodListDTO {
    return {
      data: apiList.data.map((pm) => this.mapPaymentMethodToDTO(pm)),
      hasMore: apiList.has_more,
    };
  }
}
