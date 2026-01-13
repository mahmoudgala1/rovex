import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import FleetOperator from "../models/FleetOperator";
import { AppError } from "../utils/errors";
import { successResponse } from "../utils/responses";
import { logger } from "../utils/logger";
import AuditLog from "../models/AuditLog";
import notificationService from "../services/notification.service";
import PasswordResetToken from "../models/PasswordResetToken";
import authService from "../services/auth.service";
import { env } from "../config/environment";
import CompanyUser from "../models/CompanyUser";
import Company from "../models/Company";
import RabbitMQPublisher from "../services/rabbitmq.service";

const RESET_TOKEN_EXPIRY_MIN = 30;

class AuthController {
  fleetLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      const operator = await FleetOperator.findOne({ email, status: "active" });
      if (!operator) {
        throw new AppError("Invalid credentials", 401);
      }

      const isPasswordValid = await (operator as any).comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 401);
      }

      const tokens = authService.generateTokens({
        user_id: operator.operator_id,
        email: operator.email,
        user_type: "fleet_operator",
        role: operator.role,
        permissions: operator.permissions,
        token_version: operator.token_version,
      });

      operator.last_login = new Date();
      await operator.save();

      await this.logAudit({
        actor_id: operator.operator_id,
        actor_type: "fleet_operator",
        action: "auth.login",
        resource_type: "session",
        resource_id: operator.operator_id,
        ip_address: req.ip,
      });

      successResponse(
        res,
        {
          user: {
            operator_id: operator.operator_id,
            email: operator.email,
            name: operator.name,
            role: operator.role,
            permissions: operator.permissions,
            password_must_change: operator.password_must_change,
          },
          tokens,
        },
        "Login successful"
      );
    } catch (error) {
      next(error);
    }
  };

  changePasswordFleet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { current_password, new_password } = req.body;
      const user_id = req.user!.user_id;

      const user = await FleetOperator.findOne({
        operator_id: user_id,
        status: "active",
      });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const isCurrentPasswordValid = await (user as any).comparePassword(
        current_password
      );
      if (!isCurrentPasswordValid) {
        throw new AppError("Current password is incorrect", 401);
      }

      const isSamePassword = await (user as any).comparePassword(new_password);
      if (isSamePassword) {
        throw new AppError(
          "New password must be different from current password",
          400
        );
      }

      user.password_hash = new_password;
      user.password_must_change = false;
      await user.save();

      await AuditLog.create({
        actor_id: user.operator_id,
        actor_type: "fleet_operator",
        action: "auth.password_changed",
        resource_type: "user",
        resource_id: user.operator_id,
        ip_address: req.ip,
      });

      await RabbitMQPublisher.publishEvent("user.create", {
        channels: ["email"],
        data: {
          email: user.email,
          subject: "Your ROVEX password was changed",
          template: "password_changed",
          theme: "dark",
          data: {
            name: user.name,
            timestamp: new Date().toLocaleString(),
            ip_address: req.ip,
            support_email: env.SUPPORT_EMAIL,
          },
        },
        metadata: {
          timestamp: new Date().toLocaleString(),
        },
      });

      logger.info(`Password changed for fleet operator ${user.operator_id}`);

      successResponse(res, {
        message: "Password changed successfully",
        requires_relogin: false,
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordFleet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await FleetOperator.findOne({ email, status: "active" });
      if (!user) {
        successResponse(res, {
          message: "If this email exists, a reset link has been sent.",
        });
        return;
      }

      await PasswordResetToken.deleteMany({ user_id: user.operator_id });

      const { token, hashedToken } = await authService.generateResetToken();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MIN);

      await PasswordResetToken.create({
        user_id: user.operator_id,
        token_hash: hashedToken,
        expires_at: expiresAt,
      });

      const resetUrl = `${process.env.DASHBOARD_URL}/reset-password?type=fleet&user_id=${user.operator_id}&token=${token}`;

      await notificationService.sendEmail({
        to: user.email,
        subject: "ROVEX Fleet - Reset your password",
        template: "password_reset_request",
        theme: "light",
        data: {
          name: user.name,
          reset_url: resetUrl,
          expires_in_min: RESET_TOKEN_EXPIRY_MIN,
        },
      });

      logger.info(
        `Password reset requested for fleet operator ${user.operator_id}`
      );

      successResponse(res, {
        message: "If this email exists, a reset link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPasswordFleet = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { user_id, token, new_password } = req.body;

      const resetRecord = await PasswordResetToken.findOne({ user_id });
      if (!resetRecord) {
        throw new AppError("Invalid or expired reset token", 400);
      }

      const isValid = await bcrypt.compare(token, resetRecord.token_hash);
      if (!isValid || resetRecord.expires_at < new Date()) {
        await resetRecord.deleteOne();
        throw new AppError("Invalid or expired reset token", 400);
      }

      const user = await FleetOperator.findOne({
        operator_id: user_id,
        status: "active",
      });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      user.password_hash = new_password;
      user.password_must_change = false;
      await user.save();

      await resetRecord.deleteOne();

      await notificationService.sendEmail({
        to: user.email,
        subject: "Your ROVEX password was changed",
        template: "password_reset_success",
        theme: "dark",
        data: {
          name: user.name,
          login_url: `${env.DASHBOARD_URL}/login`,
          support_email: env.SUPPORT_EMAIL,
        },
      });

      successResponse(res, { message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };

  async fleetLogout(
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
        "fleet_operator"
      );

      successResponse(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

  companyLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      const user = await CompanyUser.findOne({
        email,
        status: "active",
      });

      if (!user) {
        throw new AppError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      const isPasswordValid = await (user as any).comparePassword(password);
      if (!isPasswordValid) {
        throw new AppError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      const company = await Company.findOne({
        company_id: user.company_id,
        status: { $in: ["active", "trial"] },
      });
      if (!company) {
        throw new AppError("Company is not active", 403, "COMPANY_NOT_ACTIVE");
      }

      const tokens = authService.generateTokens({
        user_id: user.user_id,
        email: user.email,
        user_type: "company_user",
        role: user.role as any,
        company_id: user.company_id,
        permissions: user.permissions,
        token_version: user.token_version,
      });

      user.last_login = new Date();
      await user.save();

      await this.logAudit({
        actor_id: user.user_id,
        actor_type: "company_user",
        company_id: user.company_id,
        action: "auth.login",
        resource_type: "session",
        resource_id: user.user_id,
        ip_address: req.ip,
      });

      const { password_hash, ...userResponse } = user.toObject();

      successResponse(res, { user: userResponse, tokens }, "Login successful");
    } catch (error) {
      next(error);
    }
  };

  changePasswordCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { current_password, new_password } = req.body;
      const user_id = req.user!.user_id;

      const user = await CompanyUser.findOne({ user_id, status: "active" });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const isCurrentPasswordValid = await (user as any).comparePassword(
        current_password
      );
      if (!isCurrentPasswordValid) {
        throw new AppError("Current password is incorrect", 401);
      }

      const isSamePassword = await (user as any).comparePassword(new_password);
      if (isSamePassword) {
        throw new AppError(
          "New password must be different from current password",
          400
        );
      }

      user.password_hash = new_password;
      await user.save();

      await AuditLog.create({
        actor_id: user.user_id,
        actor_type: "company_user",
        company_id: user.company_id,
        action: "auth.password_changed",
        resource_type: "user",
        resource_id: user.user_id,
        ip_address: req.ip,
      });

      await notificationService.sendEmail({
        to: user.email,
        subject: "Your ROVEX password was changed",
        template: "password_changed",
        theme: "dark",
        data: {
          name: user.name,
          timestamp: new Date().toLocaleString(),
          ip_address: req.ip,
          support_email: env.SUPPORT_EMAIL,
        },
      });

      logger.info(`Password changed for company user ${user.user_id}`);

      successResponse(res, {
        message: "Password changed successfully",
        requires_relogin: false,
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await CompanyUser.findOne({
        email,
        status: "active",
      });
      if (!user) {
        successResponse(res, {
          message: "If this email exists, a reset link has been sent.",
        });
        return;
      }

      await PasswordResetToken.deleteMany({ user_id: user.user_id });

      const { token, hashedToken } = await authService.generateResetToken();

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MIN);

      await PasswordResetToken.create({
        user_id: user.user_id,
        token_hash: hashedToken,
        expires_at: expiresAt,
      });

      const resetUrl = `${process.env.DASHBOARD_URL}/reset-password?type=company&user_id=${user.user_id}&token=${token}`;

      await notificationService.sendEmail({
        to: user.email,
        subject: "ROVEX Dashboard - Reset your password",
        template: "password_reset_request",
        theme: "light",
        data: {
          name: user.name,
          reset_url: resetUrl,
          expires_in_min: RESET_TOKEN_EXPIRY_MIN,
        },
      });

      logger.info(`Password reset requested for company user ${user.user_id}`);

      successResponse(res, {
        message: "If this email exists, a reset link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPasswordCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { user_id, token, new_password } = req.body;

      const resetRecord = await PasswordResetToken.findOne({ user_id });
      if (!resetRecord) {
        throw new AppError("Invalid or expired reset token", 400);
      }

      const isValid = await bcrypt.compare(token, resetRecord.token_hash);
      if (!isValid || resetRecord.expires_at < new Date()) {
        await resetRecord.deleteOne();
        throw new AppError("Invalid or expired reset token", 400);
      }

      const user = await CompanyUser.findOne({ user_id, status: "active" });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      user.password_hash = new_password;
      await user.save();

      await resetRecord.deleteOne();

      await notificationService.sendEmail({
        to: user.email,
        subject: "Your ROVEX password was changed",
        template: "password_reset_success",
        theme: "light",
        data: {
          name: user.name,
          login_url: `${process.env.DASHBOARD_URL}/login`,
        },
      });

      successResponse(res, { message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };

  async companyLogout(
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
        "company_user"
      );

      successResponse(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

  async logoutAllDevices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userType = req.path.includes("fleet")
        ? "fleet_operator"
        : req.path.includes("company")
        ? "company_user"
        : "customer";

      const devicesCount = await authService.logoutAllDevices(
        req.user!.user_id,
        userType
      );

      successResponse(
        res,
        { devices_logged_out: devicesCount },
        "Logged out from all devices successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new AppError(
          "Refresh token is required",
          400,
          "VALIDATION_ERROR"
        );
      }

      const tokens = await authService.refreshAccessToken(refresh_token);

      successResponse(res, tokens, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  }

  private logAudit = async (data: any): Promise<void> => {
    try {
      await AuditLog.create(data);
    } catch (error) {
      logger.error("Failed to log audit event:", error);
    }
  };
}

export default new AuthController();
