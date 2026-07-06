import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let user_id = req.headers["x-user-id"] || null;
    const user_role = req.headers["x-user-role"] || null;
    const user_type = (req.headers["x-user-type"] as string) || null;
    let company_id = req.headers["x-company-id"] || null;

    if (!user_id || !user_role) {
      errorResponse(res, "Unauthorized", 401);
      return;
    }

    if (user_role == "customer") {
      company_id = "COMP_MNHLYD2O1RE2M";
    }

    if (user_type == "fleet_operator") {
      user_id = "fleet";
    } else if (user_type == "company_user") {
      user_id = company_id;
    }

    (req as any).user = {
      id: user_id,
      role: user_role,
      type: user_type,
      company: company_id,
    };

    next();
  } catch (error) {
    errorResponse(res, "Unauthorized", 401);
    return;
  }
}
