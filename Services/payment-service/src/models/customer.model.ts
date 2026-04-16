import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  customerId: string;
  companyId: string;
  stripeCustomerId: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    stripeCustomerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: { type: String, required: true },
    name: String,
    phone: String,
  },
  { timestamps: true },
);

export const CustomerModel = mongoose.model<ICustomer>(
  "Customer",
  customerSchema,
);
