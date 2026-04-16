import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface User {
  customer_id: string;
  email: string;
  name: string;
  phone: string;
}

export interface CreatePaymentDTO {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionDTO {
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateCustomerDTO {
  customerId: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, string>;
  images?: string[];
  defaultPriceData?: {
    currency: string;
    unitAmount: number;
    recurring?: {
      interval: "day" | "week" | "month" | "year";
      intervalCount?: number;
    };
  };
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, string>;
  images?: string[];
  defaultPrice?: string;
}

export interface CreatePriceDTO {
  productId: string;
  currency: string;
  unitAmount: number;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    intervalCount?: number;
    trialPeriodDays?: number;
  };
  active?: boolean;
  nickname?: string;
  metadata?: Record<string, string>;
}

export interface UpdatePriceDTO {
  active?: boolean;
  nickname?: string;
  metadata?: Record<string, string>;
}
