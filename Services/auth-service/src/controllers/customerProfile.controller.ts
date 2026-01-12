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

export async function addAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      label,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      latitude,
      longitude,
      is_default,
      notes,
    } = req.body;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (is_default || customer.addresses.length === 0) {
      customer.addresses.forEach((addr) => {
        addr.is_default = false;
      });
    }

    const newAddress = {
      address_id: generateId("ADDR"),
      label,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country: country || "EG",
      location: {
        type: "Point" as const,
        coordinates: [longitude, latitude] as [number, number],
      },
      is_default: is_default || customer.addresses.length === 0,
      notes,
    };

    customer.addresses.push(newAddress);
    await customer.save();

    logger.info(`Address added for customer: ${customer.customer_id}`);

    successResponse(
      res,
      { address: newAddress },
      "Address added successfully",
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { address_id } = req.params;
    const updateData = req.body;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const address = customer.addresses.find(
      (addr) => addr.address_id === address_id
    );

    if (!address) {
      throw new AppError("Address not found", 404);
    }

    if (updateData.is_default) {
      customer.addresses.forEach((addr) => {
        addr.is_default = false;
      });
    }

    Object.assign(address, updateData);

    if (updateData.latitude && updateData.longitude) {
      address.location = {
        type: "Point",
        coordinates: [updateData.longitude, updateData.latitude],
      };
    }

    await customer.save();

    successResponse(res, { address }, "Address updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { address_id } = req.params;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const addressIndex = customer.addresses.findIndex(
      (addr) => addr.address_id === address_id
    );

    if (addressIndex === -1) {
      throw new AppError("Address not found", 404);
    }

    const wasDefault = customer.addresses[addressIndex].is_default;
    customer.addresses.splice(addressIndex, 1);

    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].is_default = true;
    }

    await customer.save();

    successResponse(res, null, "Address deleted successfully");
  } catch (error) {
    next(error);
  }
}

export async function setDefaultAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { address_id } = req.params;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const address = customer.addresses.find(
      (addr) => addr.address_id === address_id
    );

    if (!address) {
      throw new AppError("Address not found", 404);
    }

    customer.addresses.forEach((addr) => {
      addr.is_default = false;
    });

    address.is_default = true;

    await customer.save();

    successResponse(res, { address }, "Default address updated");
  } catch (error) {
    next(error);
  }
}

export async function getAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    }).select("addresses");

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    successResponse(
      res,
      { addresses: customer.addresses },
      "Addresses retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}
