import { stripe } from "../config/stripe.config";
import { CreateCustomerDTO } from "../types/stripe.types";
import { authGrpcClient } from "../grpc/clients/auth.client";
import { CustomerModel } from "../models/customer.model";

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
    return customer;
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
}
