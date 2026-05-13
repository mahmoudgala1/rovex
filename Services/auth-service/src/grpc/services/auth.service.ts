import * as grpc from "@grpc/grpc-js";
import Customer from "../../models/Customer";
import { logger } from "../../utils/logger";
import Company from "../../models/Company";

export class AuthGrpcService {
  async getUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { user_id, user_type } = call.request;

      let customer: any = null;
      if (user_type === "customer") {
        customer = await Customer.findOne({
          customer_id: user_id,
        }).select("-__v -_id -auth_provider -token_version");
      } else if (user_type === "company_user") {
        customer = await Company.findOne({
          company_id: user_id,
        }).select("-__v -_id -auth_provider -token_version");
      }

      if (!customer) {
        callback(null, {
          success: false,
          error: "User not found",
        });
        return;
      }

      callback(null, {
        success: true,
        user: {
          customer_id:
            user_type === "customer"
              ? customer.customer_id
              : customer.company_id,
          name: customer.name,
          email:
            user_type === "customer" ? customer.email : customer.contact.email,
          phone:
            user_type === "customer" ? customer.phone : customer.contact.phone,
        },
      });
    } catch (error) {
      logger.error("Error getting user:", error);
      callback(null, {
        success: false,
        error: (error as Error).message,
      });
    }
  }
}
