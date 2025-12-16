export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR"
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      error: {
        code: this.errorCode,
        statusCode: this.statusCode,
      },
    };
  }
}


export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR");
    if (details) {
      (this as any).details = details;
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication failed",
    errorCode: string = "AUTH_FAILED"
  ) {
    super(message, 401, errorCode);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = "Access denied",
    errorCode: string = "ACCESS_DENIED"
  ) {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    if (retryAfter) {
      (this as any).retryAfter = retryAfter;
    }
  }
}
