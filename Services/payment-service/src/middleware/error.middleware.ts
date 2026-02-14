import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

const logger = new Logger("ErrorMiddleware");

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
