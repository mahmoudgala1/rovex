import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordResetToken extends Document {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user_id: { type: String, required: true, index: true },
    token_hash: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

PasswordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPasswordResetToken>(
  "PasswordResetToken",
  PasswordResetTokenSchema
);
