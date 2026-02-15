import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  metadata: Record<string, string>;
}

export interface CreatePaymentDTO {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerDTO {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}
