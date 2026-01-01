import { Request, Response, NextFunction } from "express";
import Customer from "../models/Customer";
import { AppError } from "../utils/errors";
import { successResponse } from "../utils/responses";
import authService from "../services/auth.service";
import { logger } from "../utils/logger";
import notificationService from "../services/notification.service";
import {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
} from "../services/otp.service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      throw new AppError("Email already registered", 400);
    }

    const verificationOTP = generateOTP();
    const otpExpiry = getOTPExpiry(10);

    const newCustomer = await Customer.create({
      name,
      email,
      phone,
      password_hash: password,
      auth_provider: "local",
      status: "active",
      is_verified: false,
      verification_otp: verificationOTP,
      verification_otp_expires: otpExpiry,
    });

    try {
      await notificationService.sendEmail({
        to: email,
        subject: "Verify Your Email - ROVEX",
        template: "customer_verification_otp",
        theme: "dark",
        data: {
          name,
          otp: verificationOTP,
          expires_in: "10 minutes",
        },
      });
    } catch (emailError) {
      logger.error("Failed to send verification OTP:", emailError);
    }

    const tokens = authService.generateTokens({
      user_id: newCustomer.customer_id,
      email: newCustomer.email,
      role: "customer",
      user_type: "customer",
      permissions: ["customer:basic"],
      token_version: newCustomer.token_version,
    });

    await newCustomer.save();

    logger.info(`Customer registered: ${newCustomer.customer_id}`);

    successResponse(
      res,
      {
        user: {
          customer_id: newCustomer.customer_id,
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          is_verified: newCustomer.is_verified,
          status: newCustomer.status,
        },
        tokens,
      },
      "Registration successful. Please verify your email.",
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email }).select("+password_hash");
    if (!customer) {
      throw new AppError("Invalid email or password", 401);
    }

    if (customer.status === "banned") {
      throw new AppError("Your account has been banned. Contact support.", 403);
    }

    if (customer.status === "suspended") {
      throw new AppError("Your account is suspended. Contact support.", 403);
    }

    if (!customer.is_verified) {
  throw new AppError(
    "Please verify your email address before logging in. Check your inbox for the verification code.", 
    403
  );
}

    const isPasswordValid = await (customer as any).comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = authService.generateTokens({
      user_id: customer.customer_id,
      email: customer.email,
      role: "customer",
      user_type: "customer",
      permissions: ["customer:basic"],
      token_version: customer.token_version,
    });

    customer.last_login = new Date();
    await customer.save();

    logger.info(`Customer logged in: ${customer.customer_id}`);

    successResponse(
      res,
      {
        user: {
          customer_id: customer.customer_id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          is_verified: customer.is_verified,
          status: customer.status,
          avatar_url: customer.avatar_url,
          preferences: customer.preferences,
        },
        tokens,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp } = req.body;

    const customer = await Customer.findOne({ email }).select(
      "+verification_otp +verification_otp_expires"
    );

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (customer.is_verified) {
      throw new AppError("Email already verified", 400);
    }

    if (!customer.verification_otp || !customer.verification_otp_expires) {
      throw new AppError("No OTP found. Please request a new one.", 400);
    }

    if (isOTPExpired(customer.verification_otp_expires)) {
      throw new AppError("OTP has expired. Please request a new one.", 400);
    }

    if (customer.verification_otp !== otp) {
      throw new AppError("Invalid OTP", 400);
    }

    customer.is_verified = true;
    customer.verification_otp = undefined;
    customer.verification_otp_expires = undefined;
    await customer.save();

    logger.info(`Email verified for customer: ${customer.customer_id}`);

    successResponse(res, null, "Email verified successfully");
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email }).select(
      "+verification_otp +verification_otp_expires"
    );

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (customer.is_verified) {
      throw new AppError("Email already verified", 400);
    }

    const verificationOTP = generateOTP();
    const otpExpiry = getOTPExpiry(10);

    customer.verification_otp = verificationOTP;
    customer.verification_otp_expires = otpExpiry;
    await customer.save();

    await notificationService.sendEmail({
      to: email,
      subject: "Verification Code - ROVEX",
      template: "customer_verification_otp",
      theme: "light",
      data: {
        name: customer.name,
        otp: verificationOTP,
        expires_in: "10 minutes",
      },
    });

    logger.info(`Verification OTP resent to: ${email}`);

    successResponse(res, null, "Verification OTP sent successfully");
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { current_password, new_password } = req.body;

    const customer = await Customer.findOne({
      customer_id: req.user!.user_id,
    }).select("+password_hash");

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const isPasswordValid = await (customer as any).comparePassword(
      current_password
    );
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const isSamePassword = await (customer as any).comparePassword(
      new_password
    );
    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        400
      );
    }

    customer.password_hash = new_password;
    await customer.save();

    logger.info(`Password changed for customer: ${customer.customer_id}`);

    successResponse(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      successResponse(
        res,
        null,
        "If email exists, password reset OTP has been sent"
      );
      return;
    }

    const resetOTP = generateOTP();
    const otpExpiry = getOTPExpiry(10);

    customer.reset_password_otp = resetOTP;
    customer.reset_password_otp_expires = otpExpiry;
    await customer.save();

    await notificationService.sendEmail({
      to: email,
      subject: "Password Reset Code - ROVEX",
      template: "customer_password_reset_otp",
      theme: "light",
      data: {
        name: customer.name,
        otp: resetOTP,
        expires_in: "10 minutes",
      },
    });

    logger.info(`Password reset OTP sent to: ${email}`);

    successResponse(
      res,
      null,
      "If email exists, password reset OTP has been sent"
    );
  } catch (error) {
    next(error);
  }
}

export async function verifyResetOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp } = req.body;

    const customer = await Customer.findOne({ email }).select(
      "+reset_password_otp +reset_password_otp_expires"
    );

    if (!customer) {
      throw new AppError("Invalid request", 400);
    }

    if (!customer.reset_password_otp || !customer.reset_password_otp_expires) {
      throw new AppError("No reset OTP found. Please request a new one.", 400);
    }

    if (isOTPExpired(customer.reset_password_otp_expires)) {
      throw new AppError("OTP has expired. Please request a new one.", 400);
    }

    if (customer.reset_password_otp !== otp) {
      throw new AppError("Invalid OTP", 400);
    }

    successResponse(
      res,
      { email },
      "OTP verified successfully. You can now reset your password."
    );
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp, new_password } = req.body;

    const customer = await Customer.findOne({ email }).select(
      "+reset_password_otp +reset_password_otp_expires +password_hash"
    );

    if (!customer) {
      throw new AppError("Invalid request", 400);
    }

    if (!customer.reset_password_otp || !customer.reset_password_otp_expires) {
      throw new AppError("No reset OTP found", 400);
    }

    if (isOTPExpired(customer.reset_password_otp_expires)) {
      throw new AppError("OTP has expired", 400);
    }

    if (customer.reset_password_otp !== otp) {
      throw new AppError("Invalid OTP", 400);
    }

    customer.password_hash = new_password;
    customer.reset_password_otp = undefined;
    customer.reset_password_otp_expires = undefined;

    await customer.save();

    logger.info(`Password reset for customer: ${customer.customer_id}`);

    successResponse(res, null, "Password reset successfully");
  } catch (error) {
    next(error);
  }
}

export async function customerLogout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refresh_token } = req.body;
    const accessToken = req.headers.authorization?.replace("Bearer ", "");

    if (!accessToken || !refresh_token) {
      throw new AppError(
        "Access token and refresh token are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    await authService.logout(
      accessToken,
      refresh_token,
      req.user!.user_id,
      "customer"
    );

    successResponse(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}
