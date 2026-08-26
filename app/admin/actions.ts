"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdminApi } from "@/lib/admin/access";
import { adminCancelJob, adminMarkTechnicalFailure, adminRefundJob, adminRetryJob } from "@/lib/admin/jobs";
import { adminMarkCancelAtPeriodEnd, adminRecordMoneyRefund } from "@/lib/admin/billing-ops";
import { adminDeductCredits, adminGrantCredits, adminSetMemberStatus, adminSetTicketStatus } from "@/lib/admin/credits";
import { saveAiSettings, savePromptFramework, updatePlanPricing } from "@/lib/admin/settings";
import { SUPPORT_REPLY_SENT } from "@/lib/security/copy";
import { addSupportReply, supportMailSinkFromEnv } from "@/lib/security/support";
import { listPendingCleanup } from "@/lib/admin/queries";
import { parseAdminEmails } from "@/lib/authz/admin";
import { getAuth } from "@/lib/auth";
import { enqueueCleanup, type NotificationEnv } from "@/lib/notifications/queue";
import { pipelineDepsFromEnv } from "@/lib/production/deps";
import { immediateStep, runCommercialProduction, type ProductionParams } from "@/lib/production/pipeline";

export type AdminActionState = { error?: string; message?: string };

async function actor() {
  const session = await requireAdminApi();
  const { env } = await getCloudflareContext({ async: true });
  const adminEmails = parseAdminEmails(
    "ADMIN_EMAILS" in env ? String((env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "") : "",
  );
  return {
    db: session.db,
    userId: session.userId,
    email: session.email,
    adminEmails,
    env,
  };
}

export async function refundJobAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminRefundJob(ctx.db, ctx, String(formData.get("jobId") ?? ""));
    revalidatePath("/admin/jobs");
    return { message: "Credit refunded once." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Refund failed." };
  }
}

export async function failJobAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminMarkTechnicalFailure(ctx.db, ctx, String(formData.get("jobId") ?? ""));
    revalidatePath("/admin/jobs");
    return { message: "Marked as a technical failure." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function cancelJobAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminCancelJob(ctx.db, ctx, String(formData.get("jobId") ?? ""));
    revalidatePath("/admin/jobs");
    return { message: "Job cancelled." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Cancel failed." };
  }
}

export async function retryJobAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    const { env, ctx: execution } = await getCloudflareContext({ async: true });
    const productionEnv = env as {
      MEDIA_BUCKET: R2Bucket;
      COMMERCIAL_PRODUCTION_WORKFLOW?: {
        create: (input: { id?: string; params?: ProductionParams }) => Promise<{ id: string }>;
      };
    };
    const deps = pipelineDepsFromEnv(env as unknown as Record<string, unknown>, ctx.db, productionEnv.MEDIA_BUCKET);
    await adminRetryJob(ctx.db, ctx, String(formData.get("jobId") ?? ""), {
      ...deps,
      startWorkflow: async (params) => {
        const binding = productionEnv.COMMERCIAL_PRODUCTION_WORKFLOW;
        if (binding && typeof binding.create === "function") {
          return binding.create({ id: `${params.jobId}-retry`, params });
        }
        execution.waitUntil(runCommercialProduction(deps, params, immediateStep()).catch(() => undefined));
        return { id: params.jobId };
      },
    });
    revalidatePath("/admin/jobs");
    return { message: "Retry started from the last saved stage." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Retry failed." };
  }
}

export async function grantCreditAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminGrantCredits(ctx.db, ctx, {
      workspaceId: String(formData.get("workspaceId") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/credits");
    return { message: "Credits granted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Grant failed." };
  }
}

export async function deductCreditAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminDeductCredits(ctx.db, ctx, {
      workspaceId: String(formData.get("workspaceId") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/credits");
    return { message: "Credits deducted." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Deduct failed." };
  }
}

export async function suspendUserAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminSetMemberStatus(ctx.db, ctx, {
      userId: String(formData.get("userId") ?? ""),
      status: formData.get("status") === "active" ? "active" : "suspended",
    });
    revalidatePath("/admin/users");
    return { message: "Account status updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Status update failed." };
  }
}

export async function resetPasswordAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await requireAdminApi();
    const email = String(formData.get("email") ?? "");
    const auth = await getAuth();
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
    return { message: "If that account exists, a reset email was sent." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Reset failed." };
  }
}

export async function updatePlanAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    const amount = String(formData.get("amountMinor") ?? "").trim();
    const credits = String(formData.get("credits") ?? "").trim();
    await updatePlanPricing(ctx.db, ctx, {
      planId: String(formData.get("planId") ?? ""),
      amountMinor: amount ? Number(amount) : null,
      currency: String(formData.get("currency") ?? "ZAR"),
      credits: credits ? Number(credits) : null,
      interval: String(formData.get("interval") ?? "one_time") === "month" ? "month" : "one_time",
      active: formData.get("active") === "on",
      introductoryOffer: formData.get("introductoryOffer") === "on",
    });
    revalidatePath("/admin/pricing");
    return { message: "Plan saved. Past payments are unchanged." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Plan update failed." };
  }
}

export async function saveAiAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await saveAiSettings(ctx.db, ctx, {
      creativeDirectorProvider: String(formData.get("creativeDirectorProvider") ?? "openai"),
      creativeDirectorModel: String(formData.get("creativeDirectorModel") ?? ""),
      videoProvider: String(formData.get("videoProvider") ?? "seedance"),
      seedanceModelId: String(formData.get("seedanceModelId") ?? ""),
      topazModel: String(formData.get("topazModel") ?? "prob-4"),
      maxContextReferences: Number(formData.get("maxContextReferences") ?? 6),
      refundOnTechnicalFailure: formData.get("refundOnTechnicalFailure") === "on",
    });
    revalidatePath("/admin/ai");
    return { message: "Settings saved. Secrets stay in Wrangler, not D1." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }
}

export async function savePromptAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await savePromptFramework(ctx.db, ctx, {
      key: String(formData.get("key") ?? ""),
      body: String(formData.get("body") ?? ""),
      activate: formData.get("activate") === "on",
    });
    revalidatePath("/admin/prompts");
    return { message: "Framework saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Save failed." };
  }
}

export async function runCleanupAction(
  prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void prev;
  void formData;
  try {
    const ctx = await actor();
    const pending = await listPendingCleanup(ctx.db);
    for (const row of pending) {
      await enqueueCleanup(ctx.env as NotificationEnv, {
        workspaceId: row.workspaceId,
        objectKey: row.objectKey,
      });
    }
    revalidatePath("/admin/storage");
    return { message: `Queued cleanup for ${pending.length} deleted files. The bucket was not wiped.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Cleanup failed." };
  }
}

export async function setTicketAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    const status = String(formData.get("status") ?? "OPEN");
    if (status !== "OPEN" && status !== "IN_PROGRESS" && status !== "RESOLVED" && status !== "CLOSED") {
      return { error: "Choose a valid ticket status." };
    }
    const ticketId = String(formData.get("ticketId") ?? "");
    await adminSetTicketStatus(ctx.db, ctx, {
      ticketId,
      status,
    });
    revalidatePath("/admin/support");
    revalidatePath(`/admin/support/${ticketId}`);
    return { message: "Ticket updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ticket update failed." };
  }
}

export async function replyToTicketAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    const ticketId = String(formData.get("ticketId") ?? "");
    await addSupportReply(
      ctx.db,
      {
        ticketId,
        authorUserId: ctx.userId,
        authorRole: "staff",
        body: String(formData.get("body") ?? ""),
      },
      supportMailSinkFromEnv(ctx.env),
    );
    revalidatePath("/admin/support");
    revalidatePath(`/admin/support/${ticketId}`);
    return { message: SUPPORT_REPLY_SENT };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't send that reply." };
  }
}

export async function recordMoneyRefundAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminRecordMoneyRefund(ctx.db, ctx, {
      paymentId: String(formData.get("paymentId") ?? ""),
      note: String(formData.get("note") ?? ""),
      ticketId: String(formData.get("ticketId") ?? "") || null,
    });
    revalidatePath("/admin/payments");
    return { message: "Marked as money returned. Ad Credits were not changed." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't record that." };
  }
}

export async function markCancelAtPeriodEndAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const ctx = await actor();
    await adminMarkCancelAtPeriodEnd(ctx.db, ctx, {
      subscriptionId: String(formData.get("subscriptionId") ?? ""),
    });
    revalidatePath("/admin/subscriptions");
    return { message: "This plan now cancels at the end of the current period." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't update that plan." };
  }
}
