import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IFleetOperator } from "../types";
import { generateId } from "../utils/helpers";

const FleetOperatorSchema = new Schema<IFleetOperator>(
  {
    operator_id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId("FO"),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        "super_admin",
        "fleet_manager",
        "operations_manager",
        "support_engineer",
        "analyst",
      ],
    },
    permissions: [{ type: String }],
    password_hash: { type: String, required: true },
    password_must_change: { type: Boolean, default: false },
    status: {
      type: String,
      required: true,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    phone: String,
    two_factor_enabled: { type: Boolean, default: false },
    last_login: Date,
    token_version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

FleetOperatorSchema.index({ operator_id: 1 }, { unique: true });
FleetOperatorSchema.index({ email: 1 }, { unique: true });

FleetOperatorSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  next();
});

FleetOperatorSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

export default mongoose.model<IFleetOperator>(
  "FleetOperator",
  FleetOperatorSchema
);
