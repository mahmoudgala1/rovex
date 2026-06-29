import { Request, Response, NextFunction } from "express";
import Company from "../models/Company";

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = req.user?.company_id;

    const subscription = await Company.findOne({ company_id: companyId })
      .select("subscription")
      .lean();

    if (!subscription) {
      res.status(403).json({
        success: false,
        message: "Subscription not found",
      });
      return;
    }

    if (subscription.status !== "active") {
      res.status(403).json({
        success: false,
        message: "Your subscription is not active",
        subscriptionStatus: subscription.status,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to validate subscription access",
      error: (error as Error).message,
    });
  }
};
