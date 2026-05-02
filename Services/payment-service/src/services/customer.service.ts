import { stripe } from "../config/stripe.config";
import { CreateCustomerDTO } from "../types/stripe.types";
import { CustomerModel } from "../models/customer.model";
import { CustomerDTO, SearchResultDTO } from "../mappers/stripe.mapper";
import Stripe from "stripe";
import { Company } from "../models/company.model";

export class CustomerService {
  private async getStripeAccount(companyId: string): Promise<string> {
    console.log("Getting Stripe account for company:", companyId);
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

  async createCustomer(data: CreateCustomerDTO) {
    const stripeAccount = await this.getStripeAccount(data.companyId);

    const existing = await CustomerModel.findOne({
      companyId: data.companyId,
      email: data.email,
    });

    if (existing) {
      throw new Error(`Customer with email ${data.email} already exists`);
    }

    const customer = await stripe.customers.create(
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        metadata: {
          internalCustomerId: data.customerId,
          companyId: data.companyId,
        },
      },
      { stripeAccount },
    );

    await CustomerModel.create({
      customerId: data.customerId,
      companyId: data.companyId,
      stripeCustomerId: customer.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    return customer;
  }

  async getCustomer(companyId: string, stripeCustomerId: string) {
    const stripeAccount = await this.getStripeAccount(companyId);

    const customer = await stripe.customers.retrieve(stripeCustomerId, {
      stripeAccount,
    });

    return customer as Stripe.Customer;
  }

  async updateCustomer(
    companyId: string,
    stripeCustomerId: string,
    data: Partial<CreateCustomerDTO>,
  ) {
    const stripeAccount = await this.getStripeAccount(companyId);

    const customer = await stripe.customers.update(
      stripeCustomerId,
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      { stripeAccount },
    );

    await CustomerModel.findOneAndUpdate(
      { companyId, stripeCustomerId },
      { name: data.name, email: data.email, phone: data.phone },
    );

    return customer;
  }

  // ─────────────────────────────────────────
  async deleteCustomer(companyId: string, stripeCustomerId: string) {
    const stripeAccount = await this.getStripeAccount(companyId);

    const deleted = await stripe.customers.del(
      stripeCustomerId,
      { stripeAccount },
    );

    await CustomerModel.findOneAndDelete({ companyId, stripeCustomerId });

    return deleted;
  }

  // ─────────────────────────────────────────
  async listCustomers(
    companyId: string,
    limit: number = 10,
    startingAfter?: string,
  ) {
    const stripeAccount = await this.getStripeAccount(companyId);

    const customers = await stripe.customers.list(
      {
        limit,
        starting_after: startingAfter,
      },
      { stripeAccount },
    );

    return customers;
  }

  async searchCustomers(companyId: string, query: string) {
    const stripeAccount = await this.getStripeAccount(companyId);

    const customers = await stripe.customers.search(
      { query: query || "created>0" },
      { stripeAccount },
    );

    return customers;
  }

  mapCustomerToDTO(
    customer: Stripe.Customer,
    options?: { localUserId?: string },
  ): CustomerDTO {
    const defaultPm = customer.invoice_settings?.default_payment_method;

    return {
      id: options?.localUserId,
      stripeCustomerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      billing: {
        country: customer.address?.country,
        city: customer.address?.city,
      },
      defaultPaymentMethod:
        typeof defaultPm === "string" ? defaultPm : (defaultPm?.id ?? null),
      createdAt: new Date(customer.created * 1000).toISOString(),
    };
  }

  mapCustomerListToDTO(
    apiListOrArray: Stripe.ApiList<Stripe.Customer> | Stripe.Customer[],
  ): CustomerDTO[] {
    const customers = Array.isArray(apiListOrArray)
      ? apiListOrArray
      : apiListOrArray.data;

    return customers.map((c) => this.mapCustomerToDTO(c));
  }

  mapSearchResultToDTO<T, U>(
    searchResult: Stripe.ApiSearchResult<T>,
    mapper: (item: T) => U,
  ): SearchResultDTO<U> {
    return {
      data: searchResult.data.map(mapper),
      hasMore: searchResult.has_more,
    };
  }
}
