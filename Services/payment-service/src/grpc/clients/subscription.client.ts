import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { Logger } from "../../utils/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionPlan = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus =
  | "UNKNOWN"
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "PAUSED"
  | "INCOMPLETE";
export type RevokeReason =
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_DELETED"
  | "MANUAL_REVOKE"
  | "TRIAL_EXPIRED";

export interface GrantAccessPayload {
  user_id: string;
  plan: SubscriptionPlan;
  stripe_customer_id: string;
  stripe_sub_id: string;
  current_period_end: number; // Unix timestamp
  is_trial?: boolean;
}

export interface RevokeAccessPayload {
  user_id: string;
  reason: RevokeReason;
  stripe_sub_id: string;
}

export interface UpdateSubscriptionPayload {
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_sub_id: string;
  current_period_end: number;
  cancel_at_period_end?: boolean;
}

export interface GetSubscriptionPayload {
  user_id: string;
}

export interface SyncBillingRecordPayload {
  user_id: string;
  invoice_id: string;
  amount_paid: number; // in cents
  currency: string;
  paid_at: number; // Unix timestamp
  invoice_url: string;
}

export interface NotifyTrialEndingPayload {
  user_id: string;
  trial_end: number; // Unix timestamp
  days_remaining: number;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface GrantAccessResponse {
  success: boolean;
  message: string;
  user_id: string;
}

export interface RevokeAccessResponse {
  success: boolean;
  message: string;
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  message: string;
}

export interface GetSubscriptionResponse {
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string;
  stripe_sub_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  has_access: boolean;
}

export interface SyncBillingRecordResponse {
  success: boolean;
  record_id: string;
}

export interface NotifyTrialEndingResponse {
  success: boolean;
}

// ─── Client ───────────────────────────────────────────────────────────────────

const isDevelopment = process.env.NODE_ENV !== "production";

const PROTO_PATH = path.join(
  process.cwd(),
  `${isDevelopment ? "src" : "dist"}/protos/subscription.proto`,
);

const USER_SERVICE_URL = isDevelopment
  ? "localhost:50051"
  : "auth-service:50051";

class SubscriptionGrpcClient {
  private client: any;
  private logger: Logger;

  constructor() {
    this.logger = new Logger("GRPC SubscriptionClient");

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const subscriptionProto = grpc.loadPackageDefinition(
      packageDefinition,
    ).subscription as any;

    this.client = new subscriptionProto.UserSubscriptionService(
      USER_SERVICE_URL,
      grpc.credentials.createInsecure(),
      {
        "grpc.keepalive_time_ms": 10000,
        "grpc.keepalive_timeout_ms": 5000,
        "grpc.keepalive_permit_without_calls": 1,
      },
    );

    this.logger.info(
      `gRPC Subscription Client connected to ${USER_SERVICE_URL}`,
    );
  }

  // ─── Private Helper ─────────────────────────────────────────────────────────

  private call<TResponse>(
    method: string,
    payload: object,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      this.client[method](
        payload,
        (error: grpc.ServiceError | null, response: TResponse) => {
          if (error) {
            this.logger.error(`gRPC ${method} error:`, error);
            reject(error);
            return;
          }
          resolve(response);
        },
      );
    });
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  async grantAccess(
    payload: GrantAccessPayload,
  ): Promise<GrantAccessResponse> {
    return this.call<GrantAccessResponse>("GrantAccess", payload);
  }

  async revokeAccess(
    payload: RevokeAccessPayload,
  ): Promise<RevokeAccessResponse> {
    return this.call<RevokeAccessResponse>("RevokeAccess", payload);
  }

  async updateSubscription(
    payload: UpdateSubscriptionPayload,
  ): Promise<UpdateSubscriptionResponse> {
    return this.call<UpdateSubscriptionResponse>(
      "UpdateSubscription",
      payload,
    );
  }

  async getSubscription(
    payload: GetSubscriptionPayload,
  ): Promise<GetSubscriptionResponse> {
    return this.call<GetSubscriptionResponse>("GetSubscription", payload);
  }

  async syncBillingRecord(
    payload: SyncBillingRecordPayload,
  ): Promise<SyncBillingRecordResponse> {
    return this.call<SyncBillingRecordResponse>("SyncBillingRecord", payload);
  }

  async notifyTrialEnding(
    payload: NotifyTrialEndingPayload,
  ): Promise<NotifyTrialEndingResponse> {
    return this.call<NotifyTrialEndingResponse>(
      "NotifyTrialEnding",
      payload,
    );
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  close(): void {
    if (this.client) {
      grpc.closeClient(this.client);
      this.logger.info("gRPC Subscription Client disconnected");
    }
  }
}

export const subscriptionGrpcClient = new SubscriptionGrpcClient();

process.on("SIGTERM", () => {
  subscriptionGrpcClient.close();
});

process.on("SIGINT", () => {
  subscriptionGrpcClient.close();
});
