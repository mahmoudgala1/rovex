export interface StripeOAuthTokenResponse {
  token_type: "bearer";
  stripe_user_id: string;
  scope: "read_write" | "read_only";
  livemode: boolean;
  access_token: string;
  refresh_token: string;
  stripe_publishable_key: string;
}

export interface OAuthStatePayload {
  companyId: string;
  iat?: number;
  exp?: number;
}
