// models/company.model.ts
import { Schema, model, Document } from "mongoose";

export interface ICompanyStripe {
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  publishableKey?: string;
  scope?: "read_write" | "read_only";
  livemode: boolean;
  webhookEndpointId?: string;
  webhookSecret?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface ICompany extends Document {
  companyId: string;
  stripe: ICompanyStripe;
  status: "pending_connect" | "active" | "restricted" | "disconnected";
  platformFeePercent: number;
  currency: string;
  canAcceptPayments: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    stripe: {
      accountId: String,
      accessToken: String,
      refreshToken: String,
      publishableKey: String,
      scope: { type: String, enum: ["read_write", "read_only"] },
      livemode: { type: Boolean, default: false },
      webhookEndpointId: String,
      webhookSecret: String,
      chargesEnabled: { type: Boolean, default: false },
      payoutsEnabled: { type: Boolean, default: false },
      detailsSubmitted: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["pending_connect", "active", "restricted", "disconnected"],
      default: "pending_connect",
    },
    platformFeePercent: { type: Number, default: 2.5 },
    currency: { type: String, default: "usd" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true },
  },
);

CompanySchema.virtual("canAcceptPayments").get(function () {
  return this.stripe?.chargesEnabled && this.stripe?.detailsSubmitted;
});

export const Company = model<ICompany>("Company", CompanySchema);
