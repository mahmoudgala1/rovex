import { Company } from "../../models/company.model";
import Stripe from "stripe";
import { Logger } from "../../utils/logger";

const logger = new Logger("AccounttHandler");

export const handleAccountUpdated = async (
  event: Stripe.AccountUpdatedEvent,
): Promise<void> => {
  const stripeAccountId = event.account;
  const account = event.data.object as Stripe.Account;
  const isFullyOnboarded =
    account.charges_enabled &&
    account.details_submitted &&
    account.requirements?.currently_due?.length === 0 &&
    account.requirements?.past_due?.length === 0;

  await Company.findOneAndUpdate(
    { "stripe.accountId": stripeAccountId },
    {
      "stripe.chargesEnabled": account.charges_enabled,
      "stripe.payoutsEnabled": account.payouts_enabled,
      "stripe.detailsSubmitted": account.details_submitted,
      "stripe.capabilities.cardPayments": account.capabilities?.card_payments,
      "stripe.capabilities.transfers": account.capabilities?.transfers,
      ...(isFullyOnboarded && {
        "stripe.onboardingComplete": true,
        "stripe.onboardedAt": new Date(),
      }),
      status: account.charges_enabled ? "active" : "restricted",
    },
    { new: true },
  );

  logger.info(
    `Account updated: ${stripeAccountId} — charges: ${account.charges_enabled} | onboarded: ${isFullyOnboarded}`,
  );
};
