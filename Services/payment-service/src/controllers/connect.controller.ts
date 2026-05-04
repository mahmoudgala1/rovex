import { Request, Response } from "express";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { Company } from "../models/company.model";
import { encrypt } from "../utils/encryption";
import { OAuthStatePayload } from "../types/stripe-connect.types";
import { env } from "../config/environment";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!);

export const generateOAuthLink = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { companyId, name, email } = req.body;

  if (!companyId || !email) {
    res.status(400).json({ error: "companyId and email are required" });
    return;
  }

  const state = jwt.sign(
    { companyId } satisfies OAuthStatePayload,
    env.JWT_SECRET!,
    { expiresIn: "10m" },
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.STRIPE_CLIENT_ID!,
    scope: "read_write",
    state,
    redirect_uri: `${env.APP_URL}/api/v1/connect/callback`,
    "stripe_user[email]": email,
    "stripe_user[business_name]": name ?? "",
  });

  res.json({
    url: `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
  });
};

export const handleCallback = async (
  req: Request<{}, {}, {}, { code?: string; state?: string; error?: string }>,
  res: Response,
): Promise<void> => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    res.redirect(`${env.FRONTEND_URL}/settings?connect=failed`);
    return;
  }

  let payload: OAuthStatePayload;
  try {
    payload = jwt.verify(state, env.JWT_SECRET!) as OAuthStatePayload;
  } catch {
    res.redirect(
      `${env.FRONTEND_URL}/settings?connect=failed&reason=invalid_state`,
    );
    return;
  }

  const { companyId } = payload;

  const tokenResponse = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });

  const account = await stripe.accounts.retrieve(tokenResponse.stripe_user_id!);

  // const webhook = await stripe.webhookEndpoints.create({
  //   url: `${env.APP_URL}/api/v1/webhooks/stripe/${tokenResponse.stripe_user_id}`,
  //   enabled_events: [
  //     "payment_intent.succeeded",
  //     "payment_intent.payment_failed",
  //     "invoice.payment_succeeded",
  //     "invoice.payment_failed",
  //     "customer.subscription.updated",
  //     "customer.subscription.deleted",
  //     "account.updated",
  //   ],
  // });

  await Company.findOneAndUpdate(
    { companyId },
    {
      "stripe.accountId": tokenResponse.stripe_user_id,
      "stripe.publishableKey": tokenResponse.stripe_publishable_key,
      "stripe.accessToken": encrypt(tokenResponse.access_token!),
      "stripe.refreshToken": encrypt(tokenResponse.refresh_token!),
      "stripe.scope": tokenResponse.scope,
      "stripe.livemode": tokenResponse.livemode,
      "stripe.chargesEnabled": account.charges_enabled,
      "stripe.payoutsEnabled": account.payouts_enabled,
      "stripe.detailsSubmitted": account.details_submitted,
      // "stripe.webhookEndpointId": webhook.id,
      // "stripe.webhookSecret": encrypt(webhook.secret!),
      status: account.charges_enabled ? "active" : "pending_connect",
    },
    { upsert: true, new: true },
  );

  res.redirect(`${env.FRONTEND_URL}/settings?connect=success`);
};

export const disconnect = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { companyId } = req.params;

  const company = await Company.findOne({ companyId });

  if (!company?.stripe?.accountId) {
    res.status(400).json({ error: "No connected account found" });
    return;
  }

  await stripe.oauth.deauthorize({
    client_id: env.STRIPE_CLIENT_ID!,
    stripe_user_id: company.stripe.accountId,
  });

  await Company.findOneAndUpdate(
    { companyId },
    {
      "stripe.accountId": null,
      "stripe.accessToken": null,
      "stripe.refreshToken": null,
      "stripe.publishableKey": null,
      "stripe.webhookEndpointId": null,
      "stripe.webhookSecret": null,
      "stripe.chargesEnabled": false,
      "stripe.payoutsEnabled": false,
      "stripe.detailsSubmitted": false,
      status: "disconnected",
    },
  );

  res.json({ message: "Disconnected successfully" });
};

export const getOnboardingLink = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { companyId } = req.params;

  if (!companyId) {
    res.status(400).json({ error: "companyId is required" });
    return;
  }

  const company = await Company.findOne({ companyId });

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  if (!company.stripe?.accountId) {
    res.status(400).json({ error: "Company has no connected Stripe account" });
    return;
  }

  if (company.stripe.chargesEnabled && company.stripe.detailsSubmitted) {
    res.status(400).json({ error: "Account is already fully activated" });
    return;
  }

  const accountLink = await stripe.accountLinks.create({
    account: company.stripe.accountId,
    refresh_url: `${env.APP_URL}/api/v1/connect/onboarding-link/refresh?companyId=${companyId}`,
    return_url: `${env.FRONTEND_URL}/settings?onboarding=complete`,
    type: "account_onboarding",
  });

  res.json({ url: accountLink.url });
};

export const refreshOnboardingLink = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { companyId } = req.query as { companyId: string };

  if (!companyId) {
    res.status(400).json({ error: "companyId is required" });
    return;
  }

  const company = await Company.findOne({ companyId });

  if (!company?.stripe?.accountId) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const accountLink = await stripe.accountLinks.create({
    account: company.stripe.accountId,
    refresh_url: `${env.APP_URL}/api/v1/connect/onboarding-link/refresh?companyId=${companyId}`,
    return_url: `${env.FRONTEND_URL}/settings?onboarding=complete`,
    type: "account_onboarding",
  });

  res.redirect(accountLink.url);
};
