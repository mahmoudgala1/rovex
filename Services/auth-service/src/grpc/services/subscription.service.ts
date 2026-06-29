import * as grpc from "@grpc/grpc-js";
import Customer from "../../models/Customer";
import Company from "../../models/Company";
import { logger } from "../../utils/logger";

function mapGrpcPlanToTier(
  plan?: string,
): "starter" | "professional" | "enterprise" {
  switch ((plan || "").toUpperCase()) {
    case "PRO":
    case "PROFESSIONAL":
      return "professional";
    case "ENTERPRISE":
      return "enterprise";
    case "FREE":
    case "BASIC":
    default:
      return "starter";
  }
}

function mapGrpcStatusToUserStatus(
  status?: string,
): "active" | "trial" | "suspended" | "cancelled" {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "TRIAL":
    case "TRIALING":
      return "trial";
    case "PAST_DUE":
    case "PAUSED":
    case "INCOMPLETE":
      return "suspended";
    case "CANCELED":
    case "CANCELLED":
      return "cancelled";
    default:
      return "trial";
  }
}

function getDefaultPricingByTier(
  tier: "starter" | "professional" | "enterprise",
) {
  if (tier === "enterprise") {
    return {
      base_fee: 199,
      per_delivery_fee: 2,
      included_deliveries: 2000,
      overage_rate: 3,
    };
  }

  if (tier === "professional") {
    return {
      base_fee: 79,
      per_delivery_fee: 3,
      included_deliveries: 500,
      overage_rate: 4,
    };
  }

  return {
    base_fee: 0,
    per_delivery_fee: 5,
    included_deliveries: 50,
    overage_rate: 6,
  };
}

async function updateUserSubscription(
  userId: string,
  payload: Record<string, unknown>,
) {

  let updatedUser: any = await Company.findOneAndUpdate(
    { company_id: userId },
    { $set: payload },
    { new: true },
  );

  if (!updatedUser) {
    updatedUser = await Company.findOneAndUpdate(
      { company_id: userId },
      { $set: payload },
      { new: true },
    );
  }

  return updatedUser;
}

export class UserSubscriptionGrpcService {
  async grantAccess(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { user_id, plan, current_period_end, is_trial } = call.request;

      const tier = mapGrpcPlanToTier(plan);
      const pricing = getDefaultPricingByTier(tier);

      const updatedUser = await updateUserSubscription(user_id, {
        "subscription.tier": tier,
        "subscription.status": is_trial ? "trial" : "active",
        "subscription.start_date": new Date(),
        "subscription.renewal_date": new Date(
          Number(current_period_end) * 1000,
        ),
        "subscription.billing_cycle": "monthly",
        "subscription.pricing.base_fee": pricing.base_fee,
        "subscription.pricing.per_delivery_fee": pricing.per_delivery_fee,
        "subscription.pricing.included_deliveries": pricing.included_deliveries,
        "subscription.pricing.overage_rate": pricing.overage_rate,
      });

      if (!updatedUser) {
        callback(null, { success: false, message: "User not found", user_id });
        return;
      }

      callback(null, {
        success: true,
        message: "Subscription activated successfully",
        user_id,
      });
    } catch (error) {
      logger.error("Error in grantAccess:", error);
      callback(null, {
        success: false,
        message: (error as Error).message,
        user_id: call.request.user_id,
      });
    }
  }

  async updateSubscription(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { user_id, plan, status, current_period_end } = call.request;

      const tier = mapGrpcPlanToTier(plan);
      const mappedStatus = mapGrpcStatusToUserStatus(status);
      const pricing = getDefaultPricingByTier(tier);

      const updatedUser = await updateUserSubscription(user_id, {
        "subscription.tier": tier,
        "subscription.status": mappedStatus,
        "subscription.renewal_date": new Date(
          Number(current_period_end) * 1000,
        ),
        "subscription.billing_cycle": "monthly",
        "subscription.pricing.base_fee": pricing.base_fee,
        "subscription.pricing.per_delivery_fee": pricing.per_delivery_fee,
        "subscription.pricing.included_deliveries": pricing.included_deliveries,
        "subscription.pricing.overage_rate": pricing.overage_rate,
      });

      if (!updatedUser) {
        callback(null, { success: false, message: "User not found" });
        return;
      }

      callback(null, {
        success: true,
        message: "Subscription updated successfully",
      });
    } catch (error) {
      logger.error("Error in updateSubscription:", error);
      callback(null, {
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async revokeAccess(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    try {
      const { user_id } = call.request;

      const updatedUser = await updateUserSubscription(user_id, {
        "subscription.status": "cancelled",
      });

      if (!updatedUser) {
        callback(null, { success: false, message: "User not found" });
        return;
      }

      callback(null, {
        success: true,
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      logger.error("Error in revokeAccess:", error);
      callback(null, {
        success: false,
        message: (error as Error).message,
      });
    }
  }
}
