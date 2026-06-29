import Stripe from "stripe";
import { env } from "./environment";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const config = {
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
  webhookSecretConnectedAccounts: env.STRIPE_WEBHOOK_SECRET_CONNECTED_ACCOUNTS || "",
  publicKey: env.STRIPE_PUBLIC_KEY || "",
};
