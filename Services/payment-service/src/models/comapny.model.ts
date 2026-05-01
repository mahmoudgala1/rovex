// models/company.model.ts
import { Schema, model } from "mongoose";

const CompanySchema = new Schema(
  {
    companyId: { type: String, required: true, index: true },
    stripe: {
      accountId: String,
      publishableKey: String,
      scope: { type: String, enum: ["read_write", "read_only"] },
      livemode: { type: Boolean, default: false },

      webhookEndpointId: String,
      webhookSecret: String,

      chargesEnabled: { type: Boolean, default: false },
      payoutsEnabled: { type: Boolean, default: false },
      detailsSubmitted: { type: Boolean, default: false },
    },

    platformFeePercent: { type: Number, default: 2.5 },
    currency: { type: String, default: "usd" },
  },
  { timestamps: true },
);

CompanySchema.virtual("canAcceptPayments").get(function () {
  return this.stripe!.chargesEnabled && this.stripe!.detailsSubmitted;
});

export const Company = model("Company", CompanySchema);
