import { eq } from "drizzle-orm";
import { assertAdminActor } from "@/lib/admin/access";
import type { Db } from "@/lib/db/client";
import { appSettings, auditLogs, plans, promptFrameworkVersions } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { parseMeta } from "@/lib/plans/format";

const SECRET_KEY = /secret|password|api[_-]?key|token|bearer/i;

export const LOCKED_AI = {
  seedanceSourceResolution: "480p",
  defaultDurationSeconds: 30,
  finalResolution: "1080p",
} as const;

export const DEFAULT_AI_SETTINGS = {
  creativeDirectorProvider: "openai",
  creativeDirectorModel: "",
  videoProvider: "seedance",
  seedanceModelId: "doubao-seedance-2.5-face",
  seedanceSourceResolution: LOCKED_AI.seedanceSourceResolution,
  defaultDurationSeconds: LOCKED_AI.defaultDurationSeconds,
  topazModel: "prob-4",
  finalResolution: LOCKED_AI.finalResolution,
  maxContextReferences: 6,
  refundOnTechnicalFailure: true,
};

export type AiSettings = typeof DEFAULT_AI_SETTINGS;

export async function getAiSettings(db: Db): Promise<AiSettings> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "ai.settings")).limit(1);
  if (!row) {
    return { ...DEFAULT_AI_SETTINGS };
  }
  try {
    const parsed = JSON.parse(row.valueJson) as Partial<AiSettings>;
    return { ...DEFAULT_AI_SETTINGS, ...parsed, ...LOCKED_AI };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export async function saveAiSettings(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: Partial<AiSettings> & Record<string, unknown>,
) {
  assertAdminActor(actor.email, actor.adminEmails);
  for (const key of Object.keys(input)) {
    if (SECRET_KEY.test(key) || (typeof input[key] === "string" && SECRET_KEY.test(String(input[key])))) {
      throw new Error("Provider secrets cannot be stored in studio settings.");
    }
  }
  const current = await getAiSettings(db);
  const next: AiSettings = {
    ...current,
    creativeDirectorProvider: String(input.creativeDirectorProvider ?? current.creativeDirectorProvider),
    creativeDirectorModel: String(input.creativeDirectorModel ?? current.creativeDirectorModel),
    videoProvider: String(input.videoProvider ?? current.videoProvider),
    seedanceModelId: String(input.seedanceModelId ?? current.seedanceModelId),
    topazModel: String(input.topazModel ?? current.topazModel),
    maxContextReferences: Number(input.maxContextReferences ?? current.maxContextReferences) || 6,
    refundOnTechnicalFailure: Boolean(input.refundOnTechnicalFailure ?? current.refundOnTechnicalFailure),
    ...LOCKED_AI,
  };
  const now = new Date();
  const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, "ai.settings")).limit(1);
  if (existing) {
    await db
      .update(appSettings)
      .set({ valueJson: JSON.stringify(next), updatedAt: now })
      .where(eq(appSettings.key, "ai.settings"));
  } else {
    await db.insert(appSettings).values({
      key: "ai.settings",
      valueJson: JSON.stringify(next),
      updatedAt: now,
    });
  }
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    action: "admin.ai_settings_updated",
    targetType: "app_settings",
    targetId: "ai.settings",
    createdAt: now,
  });
  return next;
}

export async function listPromptFrameworks(db: Db) {
  return db.select().from(promptFrameworkVersions);
}

export async function savePromptFramework(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { key: string; body: string; activate: boolean },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  const key = input.key.trim();
  const body = input.body.trim();
  if (!key || !body) {
    throw new Error("Enter a framework key and body.");
  }
  const existing = await db.select().from(promptFrameworkVersions).where(eq(promptFrameworkVersions.key, key));
  const version = existing.reduce((max, row) => Math.max(max, row.version), 0) + 1;
  const id = newId();
  await db.insert(promptFrameworkVersions).values({
    id,
    key,
    version,
    body,
    active: input.activate,
    createdAt: new Date(),
  });
  if (input.activate) {
    for (const row of existing) {
      await db.update(promptFrameworkVersions).set({ active: false }).where(eq(promptFrameworkVersions.id, row.id));
    }
  }
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    action: "admin.prompt_updated",
    targetType: "prompt_framework",
    targetId: id,
    createdAt: new Date(),
  });
  return id;
}

export async function updatePlanPricing(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: {
    planId: string;
    amountMinor: number | null;
    currency: string;
    credits: number | null;
    interval: "one_time" | "month";
    active: boolean;
    introductoryOffer: boolean;
  },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  const [plan] = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
  if (!plan) {
    throw new Error("That plan was not found.");
  }
  const meta = parseMeta(plan.metadataJson);
  meta.introductory = input.introductoryOffer;
  await db
    .update(plans)
    .set({
      amountMinor: input.amountMinor,
      currency: input.currency.trim().toUpperCase(),
      credits: input.credits,
      interval: input.interval,
      active: input.active,
      metadataJson: JSON.stringify(meta),
    })
    .where(eq(plans.id, input.planId));
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    action: "admin.plan_updated",
    targetType: "plan",
    targetId: input.planId,
    createdAt: new Date(),
  });
}
