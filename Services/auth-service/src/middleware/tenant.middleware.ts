import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";


export function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.user && req.user.company_id) {
    req.company_id = req.user.company_id;
  }
  next();
}

export function requireTenant(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.company_id) {
    throw new AppError("Company context required", 403);
  }
  next();
}

export function enforceTenantIsolation(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.user?.role === "super_admin") {
    return next();
  }

  const userCompanyId = req.user?.company_id;
  const targetCompanyId =
    req.company_id || req.params.company_id || req.body.company_id;

  if (!userCompanyId) {
    throw new AppError("User company context missing", 403);
  }

  if (targetCompanyId && targetCompanyId !== userCompanyId) {
    logger.warn(
      `Tenant isolation violation: User ${req.user?.user_id} (${userCompanyId}) attempted to access ${targetCompanyId}`
    );
    throw new AppError("Access denied: Cannot access other company data", 403);
  }

  req.company_id = userCompanyId;
  next();
}