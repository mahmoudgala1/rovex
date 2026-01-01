import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/environment";
import FleetOperator from "../models/FleetOperator";
import TokenBlacklist from "../models/TokenBlacklist";
import { AppError } from "../utils/errors";
import { JWTPayload } from "../types";
import CompanyUser from "../models/CompanyUser";
import Customer from "../models/Customer";

class AuthService {
  generateTokens(payload: Omit<JWTPayload, "type">): {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } {
    const accessPayload = { ...payload, type: "access" as const };
    const refreshPayload = { ...payload, type: "refresh" as const };

    const signOptions: SignOptions = {
      algorithm: "HS256",
    };

    const access_token = jwt.sign(accessPayload, env.JWT_SECRET, {
      ...signOptions,
      expiresIn: env.JWT_EXPIRES_IN || "24h",
    } as SignOptions);

    const refresh_token = jwt.sign(
      refreshPayload,
      env.JWT_REFRESH_SECRET || env.JWT_SECRET,
      {
        ...signOptions,
        expiresIn: env.JWT_REFRESH_EXPIRES_IN || "7d",
      } as SignOptions
    );

    return {
      access_token,
      refresh_token,
      expires_in: 3600,
    };
  }

  generateTempPassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + special;

    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  async generateResetToken(): Promise<{ token: string; hashedToken: string }> {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);
    return { token, hashedToken };
  }

  async logout(
    accessToken: string,
    refreshToken: string,
    userId: string,
    userType: "fleet_operator" | "company_user" | "customer"
  ): Promise<void> {
    try {
      const accessDecoded: any = jwt.decode(accessToken);
      const refreshDecoded: any = jwt.decode(refreshToken);

      if (!accessDecoded || !refreshDecoded) {
        throw new AppError("Invalid tokens", 400, "AUTH_INVALID_TOKEN");
      }

      const now = new Date();

      await TokenBlacklist.insertMany([
        {
          token: accessToken,
          user_id: userId,
          user_type: userType,
          blacklisted_at: now,
          expires_at: new Date(accessDecoded.exp * 1000),
        },
        {
          token: refreshToken,
          user_id: userId,
          user_type: userType,
          blacklisted_at: now,
          expires_at: new Date(refreshDecoded.exp * 1000),
        },
      ]);
    } catch (error: any) {
      throw new AppError("Failed to logout", 500, "LOGOUT_FAILED");
    }
  }

  async logoutAllDevices(
    userId: string,
    userType: "fleet_operator" | "company_user" | "customer"
  ): Promise<number> {
    try {
      let result: any;

      if (userType === "fleet_operator") {
        result = await FleetOperator.findOneAndUpdate(
          { operator_id: userId },
          { $inc: { token_version: 1 } },
          { new: true }
        );
      } else if (userType === "company_user") {
        result = await CompanyUser.findOneAndUpdate(
          { user_id: userId },
          { $inc: { token_version: 1 } },
          { new: true }
        );
      } else {
        result = await Customer.findOneAndUpdate(
          { customer_id: userId },
          { $inc: { token_version: 1 } },
          { new: true }
        );
      }

      if (!result) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }

      return 1;
    } catch (error: any) {
      throw new AppError(
        "Failed to logout from all devices",
        500,
        "LOGOUT_ALL_FAILED"
      );
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await TokenBlacklist.findOne({ token });
    return !!blacklisted;
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    try {
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new AppError("Token has been revoked", 401, "AUTH_TOKEN_REVOKED");
      }
      const decoded = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET || env.JWT_SECRET
      ) as JWTPayload;

      if (decoded.type !== "refresh") {
        throw new AppError(
          "Invalid token type",
          401,
          "AUTH_INVALID_TOKEN_TYPE"
        );
      }

      const payload: Omit<JWTPayload, "type"> = {
        user_id: decoded.user_id,
        email: decoded.email,
        user_type: decoded.user_type,
        role: decoded.role,
        permissions: decoded.permissions,
        token_version: decoded.token_version,
      };

      if (decoded.company_id) {
        payload.company_id = decoded.company_id;
      }

      const accessPayload = { ...payload, type: "access" as const };
      const signOptions: SignOptions = { algorithm: "HS256" };

      const access_token = jwt.sign(accessPayload, env.JWT_SECRET, {
        ...signOptions,
        expiresIn: env.JWT_EXPIRES_IN || "1h",
      } as SignOptions);

      return {
        access_token,
        expires_in: 3600,
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          "Refresh token has expired",
          401,
          "AUTH_TOKEN_EXPIRED"
        );
      } else if (error.name === "JsonWebTokenError") {
        throw new AppError(
          "Invalid refresh token",
          401,
          "AUTH_INVALID_REFRESH_TOKEN"
        );
      }
      throw error;
    }
  }
}

export default new AuthService();
