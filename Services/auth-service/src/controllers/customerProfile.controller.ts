import { Request, Response, NextFunction } from "express";
import Customer from "../models/Customer";
import { AppError } from "../utils/errors";
import { successResponse } from "../utils/responses";
import { logger } from "../utils/logger";
import { generateId } from "../utils/helpers";
import cloudinary from "../config/cloudinary";

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    }).select("-__v -_id -auth_provider -token_version");

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    successResponse(res, { customer }, "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, phone } = req.body;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    }).select("-__v -auth_provider -token_version");

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;

    if (req.file) {
      try {
        if (customer.avatar_public_id) {
          await cloudinary.uploader.destroy(customer.avatar_public_id);
          logger.info(`Deleted old avatar: ${customer.avatar_public_id}`);
        }
        customer.avatar_url = req.file.path;
        customer.avatar_public_id = req.file.filename;
      } catch (error) {
        throw new AppError("Failed to update avatar", 500);
      }
    }

    await customer.save();

    logger.info(`Profile updated for customer: ${customer.customer_id}`);

    successResponse(res, { customer }, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { language, notifications, marketing_opt_in } = req.body;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    }).select("-__v -auth_provider -token_version");

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (language) customer.preferences.language = language;
    if (notifications) {
      customer.preferences.notifications = {
        ...customer.preferences.notifications,
        ...notifications,
      };
    }
    if (marketing_opt_in !== undefined) {
      customer.preferences.marketing_opt_in = marketing_opt_in;
    }

    await customer.save();

    successResponse(res, { customer }, "Preferences updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { password } = req.body;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    }).select("+password_hash");

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const isValid = await (customer as any).comparePassword(password);
    if (!isValid) {
      throw new AppError("Incorrect password", 400);
    }

    customer.status = "banned";
    await customer.save();

    logger.info(`Account deleted for customer: ${customer.customer_id}`);

    successResponse(res, null, "Account deleted successfully");
  } catch (error) {
    next(error);
  }
}
