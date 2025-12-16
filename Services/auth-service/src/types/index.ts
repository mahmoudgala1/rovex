import { Document } from "mongoose";

export interface IFleetOperator extends Document {
  operator_id: string;
  email: string;
  name: string;
  role:
    | "super_admin"
    | "fleet_manager"
    | "operations_manager"
    | "support_engineer"
    | "analyst";
  permissions: string[];
  password_hash: string;
  password_must_change: Boolean;
  status: "active" | "suspended" | "inactive";
  phone?: string;
  two_factor_enabled: boolean;
  last_login?: Date;
  token_version: number;
  created_at: Date;
  updated_at: Date;
}

export type CompanyUserRole =
  | "company_admin"
  | "dispatcher"
  | "store_manager"
  | "customer_support"
  | "analyst";

export type FleetOperatorRole =
  | "super_admin"
  | "fleet_manager"
  | "operations_manager"
  | "support_engineer"
  | "analyst";

export type UserRole = CompanyUserRole | FleetOperatorRole;

export type UserType = "company_user" | "fleet_operator";

export interface JWTPayload {
  user_id: string;
  email: string;
  role: UserRole;
  user_type: UserType;
  company_id?: string;
  permissions: string[];
  type: "access" | "refresh";
  token_version: number;
  iat?: number;
  exp?: number;
}
