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

    // if (!user_id || !user_role) {
    //   errorResponse(res, "Unauthorized", 401);
    //   return;
    // }

    if (user_role == "customer") {
      company_id = "COMP_MNHLYD2O1RE2M";
    }

    const customer = await CustomerModel.findOne({
      customerId: "CUST_MNH5J2FNOFG6C",
      // customerId: user_id,
    });

    if (!customer) {
      const { user } = await authGrpcClient.getUser(String(user_id));

      const stripeCustomer = await new CustomerService().createCustomer({
        customerId: user!.customer_id,
        companyId: company_id as string,
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
      });
      stripeCustomerId = stripeCustomer.id;
    } else {
      stripeCustomerId = customer.stripeCustomerId;
    }

    (req as any).user = {
      id: "CUST_MNH5J2FNOFG6C",
      role: "company_admin",
      type: user_type,
      company: "COMP_MNHLYD2O1RE2M",
      stripeCustomerId,
    };

    next();
  } catch (error) {
    errorResponse(res, "Unauthorized", 401);
    return;
  }
}

export const restrictTo = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !allowedRoles.includes((req as any).user.role)) {
      errorResponse(
        res,
        "You do not have permission to perform this action",
        403,
      );
      return;
    }
    next();
  };
};
