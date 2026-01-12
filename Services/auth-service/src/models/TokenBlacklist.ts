import mongoose, { Schema, Document } from "mongoose";

export interface ITokenBlacklist extends Document {
  token: string;
  user_id: string;
  user_type: "fleet_operator" | "company_user" | "customer";
  blacklisted_at: Date;
  expires_at: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: "The JWT token that has been blacklisted",
    },
    user_id: {
      type: String,
      required: true,
      index: true,
      description: "ID of the user who owns this token",
    },
    user_type: {
      type: String,
      enum: ["fleet_operator", "company_user", "customer"],
      required: true,
      description: "Type of user (fleet_operator, company_user, or customer)",
    },
    blacklisted_at: {
      type: Date,
      default: Date.now,
      description: "Timestamp when the token was blacklisted",
    },
    expires_at: {
      type: Date,
      required: true,
      description: "When the token expires (from JWT exp claim)",
    },
  },
  {
    timestamps: true,
    collection: "token_blacklist",
  }
);

TokenBlacklistSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

TokenBlacklistSchema.index({ user_id: 1, user_type: 1 });

export default mongoose.model<ITokenBlacklist>(
  "TokenBlacklist",
  TokenBlacklistSchema
);
