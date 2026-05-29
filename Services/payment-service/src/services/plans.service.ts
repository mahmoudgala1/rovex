import Stripe from 'stripe';
import { PlanResponse, PriceInfo } from '../types/plans.types';
import { stripe } from "../config/stripe.config";

function formatPrice(p: Stripe.Price | null): PriceInfo | null {
  if (!p) return null;
  return {
    id:       p.id,
    amount:   p.unit_amount? p.unit_amount / 100 : 0,
    currency: p.currency,
    interval: p.recurring?.interval ?? '',
    nickname: p.nickname,
    metadata: p.metadata as Record<string, string>,
  };
}

function buildPlan(product: Stripe.Product, prices: Stripe.Price[]): PlanResponse {
  const meta     = product.metadata;
  const monthly  = prices.find((p) => p.recurring?.interval === 'month') ?? null;
  const annual   = prices.find((p) => p.recurring?.interval === 'year')  ?? null;

  return {
    productId:   product.id,
    name:        product.name,
    description: product.description,
    planKey:     meta.plan_key,
    active:      product.active,
    limits: {
      rovers:         parseInt(meta.rovers_limit    ?? '0'),
      ordersPerMonth: parseInt(meta.orders_per_month ?? '0'),
      branches:       parseInt(meta.branches_limit   ?? '0'),
      apiAccess:      meta.api_access === 'true',
      gateways:       (meta.gateways     ?? '').split(',').filter(Boolean),
      notifications:  (meta.notifications ?? '').split(',').filter(Boolean),
      supportSla:     meta.support_sla ?? '',
    },
    features: (meta.features ?? '').split('|').filter(Boolean),
    prices: {
      monthly: formatPrice(monthly),
      annual:  formatPrice(annual),
    },
  };
}

async function fetchPricesForProduct(productId: string): Promise<Stripe.Price[]> {
  const res = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  return res.data;
}

export async function getAllPlans(): Promise<PlanResponse[]> {
  const productsRes = await stripe.products.list({ active: true, limit: 20 });

  const rovexProducts = productsRes.data.filter((p) => p.metadata?.plan_key);

  if (!rovexProducts.length) return [];

  const plans = await Promise.all(
    rovexProducts.map(async (product) => {
      const prices = await fetchPricesForProduct(product.id);
      return buildPlan(product, prices);
    })
  );

  return plans.sort(
    (a, b) => (a.prices.monthly?.amount ?? 0) - (b.prices.monthly?.amount ?? 0)
  );
}

export async function getPlanByKey(planKey: string): Promise<PlanResponse | null> {
  const productsRes = await stripe.products.list({ active: true, limit: 20 });

  const product = productsRes.data.find((p) => p.metadata?.plan_key === planKey);
  if (!product) return null;

  const prices = await fetchPricesForProduct(product.id);
  return buildPlan(product, prices);
}
