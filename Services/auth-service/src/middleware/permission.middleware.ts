import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "../config/permissions";
import { logger } from "../utils/logger";


export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      if (!hasPermission(req.user.permissions, permission)) {
        logger.warn(
          `Permission denied: ${req.user.user_id} attempted ${permission}`,
          {
            user_id: req.user.user_id,
            role: req.user.role,
            required_permission: permission,
            user_permissions: req.user.permissions,
          }
        );

        throw new AppError(`Permission denied: ${permission} required`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      if (!hasAnyPermission(req.user.permissions, permissions)) {
        logger.warn(
          `Permission denied: ${
            req.user.user_id
          } attempted any of [${permissions.join(", ")}]`,
          {
            user_id: req.user.user_id,
            role: req.user.role,
            required_permissions: permissions,
            user_permissions: req.user.permissions,
          }
        );

        throw new AppError(
          `Permission denied: one of [${permissions.join(", ")}] required`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAllPermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      if (!hasAllPermissions(req.user.permissions, permissions)) {
        logger.warn(
          `Permission denied: ${
            req.user.user_id
          } attempted all of [${permissions.join(", ")}]`,
          {
            user_id: req.user.user_id,
            role: req.user.role,
            required_permissions: permissions,
            user_permissions: req.user.permissions,
          }
        );

        throw new AppError(
          `Permission denied: all of [${permissions.join(", ")}] required`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!req.user.permissions.includes("*")) {
      logger.warn(`Super admin access denied: ${req.user.user_id}`, {
        user_id: req.user.user_id,
        role: req.user.role,
      });

      throw new AppError("Super admin access required", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
