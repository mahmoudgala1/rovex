import { PaymentMethodDTO } from "../mappers/stripe.mapper";
import { stripe } from "../config/stripe.config";
import Stripe from "stripe";

export class PaymentMethodService {
  async createPaymentMethod(data: {
    type: string;
    card?: Stripe.PaymentMethodCreateParams.Card;
    billingDetails?: Stripe.PaymentMethodCreateParams.BillingDetails;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await stripe.paymentMethods.create({
      type: data.type as any,
      card: data.card,
      billing_details: data.billingDetails,
      metadata: data.metadata,
    });

    return paymentMethod;
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return paymentMethod;
  }

  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  }

  async getPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  }

  async listPaymentMethods(
    customerId: string,
    type?: string,
    limit: number = 10,
  ): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    const params: Stripe.PaymentMethodListParams = {
      customer: customerId,
      limit,
    };

    if (type) {
      params.type = type as any;
    }

    const paymentMethods = await stripe.paymentMethods.list(params);
    return paymentMethods;
  }

  async updatePaymentMethod(
    paymentMethodId: string,
    data: {
      billingDetails?: Stripe.PaymentMethodUpdateParams.BillingDetails;
      card?: Stripe.PaymentMethodUpdateParams.Card;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await stripe.paymentMethods.update(paymentMethodId, {
      billing_details: data.billingDetails,
      card: data.card,
      metadata: data.metadata,
    });

    return paymentMethod;
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return customer;
  }

  async getDefaultPaymentMethod(
    customerId: string,
  ): Promise<Stripe.PaymentMethod | null> {
    const customer = (await stripe.customers.retrieve(customerId, {
      expand: ["invoice_settings.default_payment_method"],
    })) as Stripe.Customer;

    if (
      customer.invoice_settings?.default_payment_method &&
      typeof customer.invoice_settings.default_payment_method === "object"
    ) {
      return customer.invoice_settings
        .default_payment_method as Stripe.PaymentMethod;
    }

    return null;
  }

  async createSetupIntent(
    customerId: string,
    paymentMethodTypes: string[] = ["card"],
  ): Promise<Stripe.SetupIntent> {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: paymentMethodTypes as any,
      usage: "off_session",
    });

    return setupIntent;
  }

  async confirmSetupIntent(
    setupIntentId: string,
    paymentMethodId: string,
  ): Promise<Stripe.SetupIntent> {
    const setupIntent = await stripe.setupIntents.confirm(setupIntentId, {
      payment_method: paymentMethodId,
    });

    return setupIntent;
  }

  async getSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    return setupIntent;
  }

  async cancelSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
    const setupIntent = await stripe.setupIntents.cancel(setupIntentId);
    return setupIntent;
  }

  async createAndAttachPaymentMethod(
    customerId: string,
    data: {
      type: string;
      card?: Stripe.PaymentMethodCreateParams.Card;
      billingDetails?: Stripe.PaymentMethodCreateParams.BillingDetails;
      setAsDefault?: boolean;
    },
  ): Promise<{
    paymentMethod: Stripe.PaymentMethod;
    customer?: Stripe.Customer;
  }> {
    const paymentMethod = await this.createPaymentMethod({
      type: data.type,
      card: data.card,
      billingDetails: data.billingDetails,
    });

    await this.attachPaymentMethod(paymentMethod.id, customerId);

    let customer: Stripe.Customer | undefined;
    if (data.setAsDefault) {
      customer = await this.setDefaultPaymentMethod(
        customerId,
        paymentMethod.id,
      );
    }

    return { paymentMethod, customer };
  }

  async validateCard(
    cardNumber: string,
    expMonth: number,
    expYear: number,
    cvc: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
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

    const currentYear = new Date().getFullYear();
    if (expYear < currentYear) {
      errors.push("Card has expired");
    }

    if (cvc.length < 3 || cvc.length > 4) {
      errors.push("Invalid CVC");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  mapPaymentMethodToDTO(
    pm: Stripe.PaymentMethod,
    options?: { isDefault?: boolean; status?: "active" | "archived" },
  ): PaymentMethodDTO {
    const card = pm.card!;
    return {
      id: pm.id,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      isDefault: options?.isDefault ?? false,
      status:
        options?.status ??
        (pm.metadata?.deleted === "true" ? "archived" : "active"),
    };
  }

  mapPaymentMethodListToDTO(
    pms: Stripe.PaymentMethod[],
    options?: { defaultPaymentMethodId?: string },
  ): PaymentMethodDTO[] {
    return pms.map((pm) =>
      this.mapPaymentMethodToDTO(pm, {
        isDefault: options?.defaultPaymentMethodId === pm.id,
        status: pm.metadata?.deleted === "true" ? "archived" : "active",
      }),
    );
  }
}
