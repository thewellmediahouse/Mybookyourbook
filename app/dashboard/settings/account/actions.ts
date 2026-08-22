"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, requireUser } from "@/lib/auth";
import { getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { cancelWorkspaceSubscription } from "@/lib/billing/cancel";
import { getDb } from "@/lib/db/client";
import { account } from "@/lib/db/schema";
import { PaymentError, tryGetPaymentProvider } from "@/lib/providers/payments";
import { queueObjectCleanup } from "@/lib/security/cleanup";
import { deleteAccount } from "@/lib/security/delete";

export type AccountActionState = { error?: string };

type PasswordContext = {
  password: {
    verify: (input: { password: string; hash: string }) => Promise<boolean>;
  };
};

export async function deleteAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await requireUser();
  const db = await getDb();
  const [credential] = await db
    .select({ password: account.password })
    .from(account)
    .where(eq(account.userId, session.user.id))
    .limit(1);
  const hasPassword = Boolean(credential?.password);
  const auth = await getAuth();

  try {
    await deleteAccount(
      db,
      {
        userId: session.user.id,
        confirmation: String(formData.get("confirmation") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
      {
        hasPassword,
        verifyPassword: async (password) => {
          if (!credential?.password) {
            return false;
          }
          const ctx = (await (
            auth as unknown as { $context: Promise<PasswordContext> }
          ).$context) as PasswordContext;
          return ctx.password.verify({ password, hash: credential.password });
        },
        cancelOwnedSubscription: async (workspaceId) => {
          try {
            const env = await getPaymentsEnv();
            const setup = getPaymentsSetup(env);
            const provider = tryGetPaymentProvider(env);
            if (!provider) {
              return;
            }
            await cancelWorkspaceSubscription(db, {
              workspaceId,
              provider,
              adapter: setup.adapter,
            });
          } catch (error) {
            if (error instanceof PaymentError && error.code === "NO_SUBSCRIPTION") {
              return;
            }
            throw error;
          }
        },
        enqueueCleanup: (workspaceId, objectKey) => queueObjectCleanup(workspaceId, objectKey),
        revokeSessions: async () => {
          await auth.api.revokeSessions({
            headers: await headers(),
          });
        },
      },
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't close this account." };
  }

  redirect("/login");
}
