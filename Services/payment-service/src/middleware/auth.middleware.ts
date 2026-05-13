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
      company_id = "COMP_MNHLYD2O1RE2M";
    }

    console.log(user_id, user_role, user_type, company_id);

    if (user_type === "customer" || user_type === "company_user") {
      const customer = await CustomerModel.findOne({
        customerId: user_type === "customer" ? user_id : company_id,
      });

      if (!customer) {
        const { user } = await authGrpcClient.getUser(
          user_type === "customer" ? String(user_id) : String(company_id),
          String(user_type),
        );

        console.log(user);

        const stripeCustomer = await new CustomerService().createCustomer({
          customerId: user!.customer_id,
          companyId:
            user_type === "customer" ? (company_id as string) : "COMP_ROVEX",
          name: user!.name,
          email: user!.email,
          phone: user!.phone,
        });
        stripeCustomerId = stripeCustomer.id;
      } else {
        stripeCustomerId = customer.stripeCustomerId;
      }
    }

    (req as any).user = {
      id: user_id,
      role: user_role,
      type: user_type,
      company: user_type === "customer" ? (company_id as string) : "COMP_ROVEX",
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
