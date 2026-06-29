function mapGrpcPlanToTier(
  plan?: string,
): "starter" | "professional" | "enterprise" {
  switch ((plan || "").toUpperCase()) {
    case "PRO":
    case "PROFESSIONAL":
      return "professional";
    case "ENTERPRISE":
      return "enterprise";
    case "FREE":
    case "BASIC":
    default:
      return "starter";
  }
}

function mapGrpcStatusToUserStatus(
  status?: string,
): "active" | "trial" | "suspended" | "cancelled" {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "TRIAL":
    case "TRIALING":
      return "trial";
    case "PAST_DUE":
    case "PAUSED":
    case "SUSPENDED":
    case "INCOMPLETE":
      return "suspended";
    case "CANCELED":
    case "CANCELLED":
      return "cancelled";
    default:
      return "trial";
  }
}

function getBillingCycleFromPeriodEnd(
  periodEnd?: number,
): "monthly" | "yearly" {
  return "monthly";
}
