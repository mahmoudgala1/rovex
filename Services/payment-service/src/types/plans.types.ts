export interface PriceInfo {
  id:       string;
  amount:   number;
  currency: string;
  interval: string;
  nickname: string | null;
  metadata: Record<string, string>;
}

export interface PlanLimits {
  rovers:         number;
  ordersPerMonth: number;
  branches:       number;
  apiAccess:      boolean;
  gateways:       string[];
  notifications:  string[];
  supportSla:     string;
}

export interface PlanResponse {
  productId:   string;
  name:        string;
  description: string | null;
  planKey:     string;
  active:      boolean;
  limits:      PlanLimits;
  features:    string[];
  prices: {
    monthly: PriceInfo | null;
    annual:  PriceInfo | null;
  };
}
