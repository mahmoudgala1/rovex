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

export interface ICoordinates {
  type: "Point";
  coordinates: [number, number];
}

export interface ILocation {
  location_id: string;
  name: string;
  address: string;
  coordinates: ICoordinates;
  operating_hours?: {
    [key: string]: { open: string; close: string };
  };
  is_primary?: boolean;
  active: boolean;
}

export interface ISubscription {
  tier: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "suspended" | "cancelled";
  start_date: Date;
  renewal_date: Date;
  billing_cycle: "monthly" | "yearly";
  pricing: {
    base_fee: number;
    per_delivery_fee: number;
    included_deliveries: number;
    overage_rate: number;
  };
}

export interface ICompany extends Document {
  company_id: string;
  name: string;
  business_type:
    | "restaurant"
    | "healthcare"
    | "campus"
    | "ecommerce"
    | "logistics";
  subscription: ISubscription;
  contact: {
    primary_contact: string;
    email: string;
    phone: string;
    address: string;
  };
  locations: ILocation[];
  api_credentials: {
    api_key: string;
    api_secret_hash: string;
    webhook_url?: string;
    webhook_secret?: string;
    rate_limit: number;
  };
  settings: {
    auto_dispatch: boolean;
    require_otp: boolean;
    enable_face_detection: boolean;
    enable_weight_check: boolean;
    default_delivery_timeout: number;
    notification_preferences: {
      email: boolean;
      sms: boolean;
      webhook: boolean;
    };
  };
  assigned_rovers: string[];
  usage_limits: {
    max_concurrent_deliveries: number;
    max_monthly_deliveries: number;
    max_locations: number;
    max_users: number;
  };
  stats: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    average_delivery_time: number;
    customer_satisfaction: number;
  };
  onboarded_by: string;
  onboarded_at: Date;
  status: "active" | "trial" | "suspended" | "cancelled";
  created_at: Date;
  updated_at: Date;
}

export interface ICompanyUser extends Document {
  user_id: string;
  company_id: string;
  email: string;
  name: string;
  role:
    | "company_admin"
    | "dispatcher"
    | "store_manager"
    | "customer_support"
    | "analyst";
  permissions: string[];
  location_access: string[];
  password_hash: string;
  status: "active" | "inactive" | "suspended";
  phone?: string;
  two_factor_enabled: boolean;
  created_by: string;
  last_login?: Date;
  preferences: {
    language: string;
    timezone: string;
    notification_channels: string[];
  };
  token_version: number;
  password_must_change: boolean;
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

export type CustomerRole = "customer";

export type UserRole = CompanyUserRole | FleetOperatorRole | CustomerRole;

export type UserType = "company_user" | "fleet_operator" | "customer";

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

export interface ICustomerAddress {
  address_id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  location: ICoordinates;
  is_default: boolean;
  notes?: string;
}

export interface ICustomer extends Document {
  customer_id: string;
  name: string;
  email: string;
  phone?: string;
  auth_provider: "local" | "google" | "apple";
  password_hash: string;
  is_verified: boolean;
  verification_otp?: string;
  verification_otp_expires?: Date;
  reset_password_otp?: string;
  reset_password_otp_expires?: Date;
  avatar_url?: string;
  addresses: ICustomerAddress[];
  preferences: {
    language: string;
    notifications: {
      sms: boolean;
      email: boolean;
      push: boolean;
    };
    marketing_opt_in: boolean;
  };
  status: "active" | "suspended" | "banned";
  last_login?: Date;
  token_version: number;
  created_at: Date;
  updated_at: Date;
}