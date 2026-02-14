import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface CreateCustomerDTO {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}
