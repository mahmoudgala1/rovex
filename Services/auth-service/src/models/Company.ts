import mongoose, { Schema } from "mongoose";
import { ICompany } from "../types";
import { generateId } from "../utils/helpers";

const CompanySchema = new Schema<ICompany>(
  {
    company_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId("COMP"),
    },
    name: { type: String, required: true, trim: true },
    business_type: {
      type: String,
      required: true,
      enum: ["restaurant", "healthcare", "campus", "ecommerce", "logistics"],
    },
    subscription: {
      tier: {
        type: String,
        required: true,
        enum: ["starter", "professional", "enterprise"],
        default: "starter",
      },
      status: {
        type: String,
        required: true,
        enum: ["active", "trial", "suspended", "cancelled"],
        default: "trial",
      },
      start_date: { type: Date, required: true, default: Date.now },
      renewal_date: { type: Date, required: true },
      billing_cycle: {
        type: String,
        required: true,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
      pricing: {
        base_fee: { type: Number, required: true, default: 0 },
        per_delivery_fee: { type: Number, required: true, default: 5 },
        included_deliveries: { type: Number, required: true, default: 50 },
        overage_rate: { type: Number, required: true, default: 6 },
      },
    },
    contact: {
      primary_contact: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    locations: [
      {
        location_id: { type: String, required: true },
        name: { type: String, required: true },
        address: { type: String, required: true },
        coordinates: {
          type: { type: String, enum: ["Point"], required: true },
          coordinates: { type: [Number], required: true },
        },
        operating_hours: { type: Schema.Types.Mixed },
        is_primary: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
      },
    ],
    api_credentials: {
      api_key: { type: String, required: true, unique: true },
      api_secret_hash: { type: String, required: true },
      webhook_url: { type: String },
      webhook_secret: { type: String },
      rate_limit: { type: Number, default: 1000 },
    },
    settings: {
      auto_dispatch: { type: Boolean, default: true },
      require_otp: { type: Boolean, default: true },
      enable_face_detection: { type: Boolean, default: false },
      enable_weight_check: { type: Boolean, default: true },
      default_delivery_timeout: { type: Number, default: 45 },
      notification_preferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        webhook: { type: Boolean, default: false },
      },
    },
    assigned_rovers: [{ type: String }],
    usage_limits: {
      max_concurrent_deliveries: { type: Number, default: 5 },
      max_monthly_deliveries: { type: Number, default: 500 },
      max_locations: { type: Number, default: 3 },
      max_users: { type: Number, default: 10 },
    },
    stats: {
      total_deliveries: { type: Number, default: 0 },
      successful_deliveries: { type: Number, default: 0 },
      failed_deliveries: { type: Number, default: 0 },
      average_delivery_time: { type: Number, default: 0 },
      customer_satisfaction: { type: Number, default: 0 },
    },
    onboarded_by: { type: String, required: true },
    onboarded_at: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ["active", "trial", "suspended", "cancelled"],
      default: "trial",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);


CompanySchema.index({ company_id: 1 }, { unique: true });
CompanySchema.index({ "subscription.status": 1 });
CompanySchema.index({ "api_credentials.api_key": 1 }, { unique: true });
CompanySchema.index({ "locations.coordinates": "2dsphere" });

export default mongoose.model<ICompany>("Company", CompanySchema);
