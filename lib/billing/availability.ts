import { getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { canManageBilling, type WorkspaceRole } from "@/lib/authz/roles";
import { BUY_CREDITS_OWNER_ONLY, BUY_CREDITS_UNAVAILABLE } from "@/lib/dashboard/copy";

export async function buyCreditsHoldReason(role: WorkspaceRole): Promise<string | null> {
  if (!canManageBilling(role)) {
    return BUY_CREDITS_OWNER_ONLY;
  }
  const env = await getPaymentsEnv();
  if (!getPaymentsSetup(env).checkoutAvailable) {
    return BUY_CREDITS_UNAVAILABLE;
  }
  return null;
}
