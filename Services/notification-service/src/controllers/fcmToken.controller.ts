import { Request, Response, NextFunction } from "express";
import { fcmTokenService } from "../services/fcmToken.service";

export class FCMTokenController {
 
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id as string;
      const { fcmToken, platform } = req.body;

      const token = await fcmTokenService.registerToken({
        userId,
        fcmToken,
        platform,
      });

      res.status(201).json({
        success: true,
        message: "FCM token registered successfully",
        data: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id as string;

      const tokens = await fcmTokenService.getTokensByUser(userId);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id as string;
      const { fcmToken } = req.body;

      const removed = await fcmTokenService.deactivateToken(userId, fcmToken);

      if (!removed) {
        res.status(404).json({ success: false, message: "Token not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "FCM token deactivated",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id as string;

      const count = await fcmTokenService.deleteAllTokensForUser(userId);

      res.status(200).json({
        success: true,
        message: `${count} token(s) removed`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const fcmTokenController = new FCMTokenController();
