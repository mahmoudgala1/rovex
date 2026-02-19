import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/stripe.types";
import { errorResponse } from "../utils/response";
import { CustomerModel } from "../models/customer.model";
import { authGrpcClient } from "../grpc/clients/auth.client";
import { CustomerService } from "../services/customer.service";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user_id = req.headers["x-user-id"] || null;
    const user_role = req.headers["x-user-role"] || null;
    const user_type = (req.headers["x-user-type"] as string) || null;
    let company_id = req.headers["x-company-id"] || null;
    let stripeCustomerId = null;

    if (!user_id || !user_role) {
      errorResponse(res, "Unauthorized", 401);
      return;
    }

    if (user_role == "customer") {
      company_id = "COMP_MJ6C7OD5JRCX9";
    }

    const customer = await CustomerModel.findOne({
      // customerId: "CUST_MJDO8PAK4MC5K",
      customerId: user_id,
    });

    if (!customer) {
      const { user } = await authGrpcClient.getUser(String(user_id));

      const stripeCustomer = await new CustomerService().createCustomer({
        customerId: user!.customer_id,
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
      });
      stripeCustomerId = stripeCustomer.id;
    } else {
      stripeCustomerId = customer.stripeCustomerId;
    }

    (req as any).user = {
      id: user_id,
      role: user_role,
      type: user_type,
      company: company_id,
      stripeCustomerId,
    };

    next();
  } catch (error) {
    errorResponse(res, "Unauthorized", 401);
    return;
  }
}
