import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment";
import { AppError } from "../utils/errors";
import authService from "../services/auth.service";
import { JWTPayload } from "../types";
import FleetOperator from "../models/FleetOperator";


export const authenticateFleetOperator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new AppError(
        "Access token is required",
        401,
        "AUTH_TOKEN_REQUIRED"
      );
    }

    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError("Token has been revoked", 401, "AUTH_TOKEN_REVOKED");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    if (decoded.type !== "access") {
      throw new AppError("Invalid token type", 401, "AUTH_INVALID_TOKEN_TYPE");
    }

    if (decoded.user_type !== "fleet_operator") {
      throw new AppError("Insufficient permissions", 403, "AUTH_FORBIDDEN");
    }

    const operator = await FleetOperator.findOne({
      operator_id: decoded.user_id,
    });
    if (!operator) {
      throw new AppError("Operator not found", 401, "AUTH_USER_NOT_FOUND");
    }

    if (operator.token_version !== decoded.token_version) {
      throw new AppError(
        "Token has been invalidated. Please login again",
        401,
        "AUTH_TOKEN_INVALIDATED"
      );
    }

    if (operator.status !== "active") {
      throw new AppError("Account is not active", 403, "AUTH_ACCOUNT_INACTIVE");
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      next(new AppError("Token has expired", 401, "AUTH_TOKEN_EXPIRED"));
    } else if (error.name === "JsonWebTokenError") {
      next(new AppError("Invalid token", 401, "AUTH_INVALID_TOKEN"));
    } else {
      next(error);
    }
  }
};

