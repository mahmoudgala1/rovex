import * as grpc from "@grpc/grpc-js";
import { Logger } from "../../utils/logger";
import { PaymentService } from "../../services/payment.service";
import { CustomerModel } from "../../models/customer.model";
import { authGrpcClient } from "../clients/auth.client";
import { CustomerService } from "../../services/customer.service";
import { Company } from "../../models/company.model";

export class PaymentGrpcService {
  private logger: Logger;
  private paymentService: PaymentService;
  constructor() {
    this.logger = new Logger("PaymentGrpcService");
    this.paymentService = new PaymentService();
  }

  async createPayment(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { customer_id, amount, currency, description, metadata } =
        call.request;
      let stripeCustomerId = null;
      const customer = await CustomerModel.findOne({
        customerId: customer_id,
      });

      if (!customer) {
        const { user } = await authGrpcClient.getUser(String(customer_id));

        const stripeCustomer = await new CustomerService().createCustomer({
          customerId: user!.customer_id,
          companyId: user!.customer_id as string,
          name: user!.name,
          email: user!.email,
          phone: user!.phone,
        });
        stripeCustomerId = stripeCustomer.id;
      } else {
        stripeCustomerId = customer.stripeCustomerId;
      }

      const paymentIntent = await this.paymentService.createPaymentIntent(
        "COMP_MNHLYD2O1RE2M",
        { amount, currency, description, metadata },
        stripeCustomerId,
      );

      if (!paymentIntent) {
        callback(null, {
          success: false,
          error: "Customer not found",
        });
        return;
      }
      const company = await Company.findOne({
        companyId: "COMP_MNHLYD2O1RE2M",
      });

      callback(null, {
        success: true,
        payment: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
          publishableKey: company!.stripe.publishableKey,
        },
      });
    } catch (error) {
      this.logger.error("Error getting user:", error);
      callback(null, {
        success: false,
        error: (error as Error).message,
      });
    }
  }
}
