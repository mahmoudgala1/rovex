import Stripe from "stripe";

export interface PaymentDTO {
  id?: string; // local payment id
  stripePaymentIntentId: string;
  customer: string;
  clientSecret?: string | null;
  amount: number;
  amountReceived: number;
  currency: string;
  description?: string | null;
  paymentMethod: string | null;
  status: Stripe.PaymentIntent.Status;
  canRetry: boolean;
  orderId?: string;
  createdAt: string;
}

export interface SubscriptionDTO {
  id?: string; // local subscription id
  stripeSubscriptionId: string;
  customer: string;
  status: Stripe.Subscription.Status;
  plan: {
    productId: string;
    priceId: string;
    code?: string;
    name: string;
    amount: number | null;
    currency: string;
    interval?: Stripe.Price.Recurring.Interval;
    intervalCount?: number | null;
  };
  currentPeriod: {
    start: string;
    end: string;
  };
  trial: {
    isInTrial: boolean;
    trialEnd: string | null;
  };
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface SubscriptionListDTO {
  data: SubscriptionDTO[];
  hasMore: boolean;
}

export interface InvoiceDTO {
  id: string;
  customer: string;
  number: string;
  status: Stripe.Invoice.Status;
  billingReason: Stripe.Invoice.BillingReason | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  createdAt: string;
  dueDate: string | null;
}

export interface InvoiceListDTO {
  data: InvoiceDTO[];
  hasMore: boolean;
}

export interface ProductDTO {
  id: string;
  code?: string;
  name: string;
  description?: string | null;
  image?: string;
  active: boolean;
  metadata: Record<string, string>;
}

export interface PriceDTO {
  id: string;
  productId: string;
  nickname?: string | null;
  amount: number | null;
  currency: string;
  interval?: Stripe.Price.Recurring.Interval;
  intervalCount?: number | null;
  active: boolean;
  isDefault?: boolean;
}

export interface CustomerDTO {
  id?: string; // local user id
  stripeCustomerId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  billing?: {
    country?: string | null;
    city?: string | null;
  };
  defaultPaymentMethod?: string | null;
  createdAt: string;
}

export interface SearchResultDTO<T> {
  data: T[];
  hasMore: boolean;
}

export interface PaymentMethodDTO {
  id: string;
  customer: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface PaymentMethodListDTO {
  data: PaymentMethodDTO[];
  hasMore: boolean;
}

export interface WebhookEventDTO {
  id: string;
  type: string;
  createdAt: string;
  data: unknown;
}
