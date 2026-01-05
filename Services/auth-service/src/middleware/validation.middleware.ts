import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../utils/errors";

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""), 
      }));

      throw new AppError("Validation failed", 400, errors);
    }

    req.body = value;
    next();
  };
}
