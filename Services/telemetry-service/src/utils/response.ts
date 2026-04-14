import { Response } from "express";

export const successResponse = (
  res: Response,
  data: any,
  message: string = "Success",
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  error: string,
  statusCode: number = 500,
) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};
