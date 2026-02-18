import { stripe } from "../config/stripe.config";
import { CreateCustomerDTO } from "../types/stripe.types";
import { CustomerModel } from "../models/customer.model";
import { CustomerDTO, SearchResultDTO } from "../mappers/stripe.mapper";
import Stripe from "stripe";

export class CustomerService {
  async createCustomer(data: CreateCustomerDTO) {
    const customer = await stripe.customers.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    await CustomerModel.create({
      customerId: data.customerId,
      stripeCustomerId: customer.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    return customer;
  }

  async getCustomer(customerId: string) {
    const customer = await stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  }

  async updateCustomer(customerId: string, data: Partial<CreateCustomerDTO>) {
    const customer = await stripe.customers.update(customerId, data);
    return customer;
  }

  async deleteCustomer(customerId: string) {
    const deleted = await stripe.customers.del(customerId);
    return deleted;
  }

  async listCustomers(limit: number = 10, startingAfter?: string) {
    const customers = await stripe.customers.list({
      limit,
      starting_after: startingAfter,
    });
    return customers;
  }

  async searchCustomers(query: string) {
    const customers = await stripe.customers.search({
      query,
    });
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
