import { Types } from "mongoose";
import { FCMTokenModel, IFCMToken } from "../models/FCMToken.model";

export interface RegisterFCMTokenDTO {
  userId: string;
  fcmToken: string;
  platform?: "android" | "ios" | "web";
}

export class FCMTokenService {
  async registerToken(dto: RegisterFCMTokenDTO): Promise<IFCMToken> {
    const { userId, fcmToken, platform = "android" } = dto;

    const token = await FCMTokenModel.findOneAndUpdate(
      { fcmToken },
      {
        $set: { userId, platform, isActive: true },
        $setOnInsert: { fcmToken },
      },
      { upsert: true, new: true, runValidators: true },
    );

    return token!;
  }

  async getTokensByUser(userId: string): Promise<IFCMToken[]> {
    return FCMTokenModel.find({
      userId,
      isActive: true,
    }).lean();
  }

  async getTokenByUserAndPlatform(
    userId: string,
    platform: "android" | "ios" | "web",
  ): Promise<IFCMToken | null> {
    return FCMTokenModel.findOne({
      userId,
      platform,
      isActive: true,
    }).lean();
  }

  async deactivateToken(userId: string, fcmToken: string): Promise<boolean> {
    const result = await FCMTokenModel.updateOne(
      { userId, fcmToken },
      { $set: { isActive: false } },
    );
    return result.modifiedCount > 0;
  }

  async deleteToken(userId: string, fcmToken: string): Promise<boolean> {
    const result = await FCMTokenModel.deleteOne({
      userId,
      fcmToken,
    });
    return result.deletedCount > 0;
  }

  async deleteAllTokensForUser(userId: string): Promise<number> {
    const result = await FCMTokenModel.deleteMany({
      userId,
    });
    return result.deletedCount;
  }
}

export const fcmTokenService = new FCMTokenService();
