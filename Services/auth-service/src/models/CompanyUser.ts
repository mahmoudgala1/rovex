import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { ICompanyUser } from "../types";
import { generateId } from "../utils/helpers";

const CompanyUserSchema = new Schema<ICompanyUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId("CU"),
    },
    company_id: { type: String, required: true, index: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        "company_admin",
        "dispatcher",
        "store_manager",
        "customer_support",
        "analyst",
      ],
    },
    permissions: [{ type: String }],
    location_access: [{ type: String }],
    password_hash: { type: String, required: true},
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    phone: String,
    two_factor_enabled: { type: Boolean, default: false },
    created_by: { type: String, required: true },
    last_login: Date,
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      notification_channels: [{ type: String, default: ["email"] }],
    },
    password_must_change: {
      type: Boolean,
      default: false,
    },
    token_version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

CompanyUserSchema.index({ user_id: 1 }, { unique: true });
CompanyUserSchema.index({ company_id: 1, email: 1 }, { unique: true });
CompanyUserSchema.index({ company_id: 1, role: 1 });

CompanyUserSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  next();
});

CompanyUserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

export default mongoose.model<ICompanyUser>("CompanyUser", CompanyUserSchema);
