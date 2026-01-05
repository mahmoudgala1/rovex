import mongoose, { Schema } from "mongoose";
import { ICustomer } from "../types";
import { generateId } from "../utils/helpers";
import bcrypt from "bcryptjs";

const CustomerSchema = new Schema<ICustomer>(
  {
    customer_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => generateId("CUST"),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      sparse: true,
      index: true,
    },

    auth_provider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    verification_otp: {
      type: String,
      select: false,
    },
    verification_otp_expires: {
      type: Date,
      select: false,
    },
    reset_password_otp: {
      type: String,
      select: false,
    },
    reset_password_otp_expires: {
      type: Date,
      select: false,
    },

    avatar_url: {
      type: String,
      default:
        "https://res.cloudinary.com/dty7q0xhs/image/upload/v1767596572/customer-avatars/default_avatar.png",
    },

    avatar_public_id: String,

    addresses: [
      {
        address_id: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        address_line1: {
          type: String,
          required: true,
        },
        address_line2: {
          type: String,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
        },
        postal_code: {
          type: String,
        },
        country: {
          type: String,
          default: "EG",
        },
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number],
            required: true,
          },
        },
        is_default: {
          type: Boolean,
          default: false,
        },
        notes: {
          type: String,
        },
      },
    ],

    preferences: {
      language: {
        type: String,
        default: "en",
        enum: ["en", "ar"],
      },
      notifications: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      marketing_opt_in: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    last_login: {
      type: Date,
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

CustomerSchema.pre("save", async function (next) {
  if (!this.isModified("password_hash")) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 10);
  next();
});

CustomerSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

CustomerSchema.index({ email: 1 });
CustomerSchema.index({ customer_id: 1 });
CustomerSchema.index({ "addresses.location": "2dsphere" });

export default mongoose.model<ICustomer>("Customer", CustomerSchema);
