import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let message = "Internal server error";
  let details;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;

    if (err.isOperational) {
      logger.warn({
        message: err.message,
        errorCode: err.errorCode,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      });
    }
  } else {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = err.message;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = "Invalid ID format";
  }

  if ((err as any).code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_KEY";
    message = "Resource already exists";
  }

  const response: any = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    "ROUTE_NOT_FOUND"
  );
  next(error);
};
