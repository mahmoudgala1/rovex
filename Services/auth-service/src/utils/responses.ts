import { Response } from "express";

export function successResponse(
  res: Response,
  data: any,
  message: string = "Success",
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any
): void {
  res.status(statusCode).json({
    status: "error",
    message,
    ...(errors && { errors }),
  });
}
