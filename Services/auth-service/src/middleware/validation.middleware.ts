import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../utils/errors";

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      throw new AppError(JSON.stringify(errors), 400);
    }

    req.body = value;
    next();
  };
}
