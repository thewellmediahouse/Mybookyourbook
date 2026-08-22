import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createMockCreativeDirector } from "@/lib/ai/creative-director";
import { requireWorkspaceMember } from "@/lib/authz/guards";
import { approveConcept } from "@/lib/creative/approve";
import { generateConceptForProject } from "@/lib/creative/generate";
import { grantCredits, getWalletBalance, generationIdempotencyKey } from "@/lib/credits/ledger";
import { createDb } from "@/lib/db/client";
import {
  assets,
  businesses,
  creditTransactions,
  notifications,
  productionEvents,
  profiles,
  projects,
  user,
} from "@/lib/db/schema";
import { completeIdentityAsset } from "@/lib/identity/complete";
import { getOrCreateIdentity, recordIdentityConsent } from "@/lib/identity/consent";
import { IDENTITY_SLOTS } from "@/lib/identity/slots";
import { newId } from "@/lib/id";
import { createMockBrandingProvider } from "@/lib/providers/branding";
import { createMockUpscaleProvider } from "@/lib/providers/upscale/topaz";
import { createMockVideoProvider } from "@/lib/providers/video/seedance";
import { createDraftProject, updateDraftBrief } from "@/lib/projects/save";
import { identityObjectKey } from "@/lib/r2/keys";
import { getWorkspaceObject, putWorkspaceObject } from "@/lib/r2/bucket";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { CUSTOMER_FAILURE, READY_TITLE } from "./copy";
import { ProductionError } from "./errors";
import { memoStep, runCommercialProduction, type PipelineDeps, type ProductionParams } from "./pipeline";
import { getJobById } from "./queries";
import { startProduction } from "./start";
import { CUSTOMER_PRODUCTION_STAGE, customerProductionLabel } from "./status";

async function insertPerson(db: ReturnType<typeof createDb>, email: string, name: string) {
  const id = newId();
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    firstName: name.split(" ")[0],
    lastName: name.split(" ").slice(1).join(" ") || name,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(profiles).values({
    userId: id,
    firstName: name.split(" ")[0] ?? "Test",
    lastName: name.split(" ").slice(1).join(" ") || "User",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function seedIdentity(
  db: ReturnType<typeof createDb>,
  bucket: R2Bucket,
  workspaceId: string,
  userId: string,
) {
  const identity = await getOrCreateIdentity(db, workspaceId, userId);
  await recordIdentityConsent(db, {
    userId,
    workspaceId,
    identityId: identity.id,
  });
  const bytes = new TextEncoder().encode("identity-ref");
  for (const role of IDENTITY_SLOTS) {
    const objectId = newId();
    const objectKey = identityObjectKey(workspaceId, userId, role, objectId);
    const mimeType = role === "IDENTITY_VIDEO" ? "video/mp4" : "image/jpeg";
    await putWorkspaceObject(bucket, {
      workspaceId,
      objectKey,
      body: bytes,
      mimeType,
    });
    await completeIdentityAsset(db, {
      workspaceId,
      userId,
      identityId: identity.id,
      role,
      objectKey,
      mimeType,
      sizeBytes: bytes.byteLength,
      durationSeconds: role === "IDENTITY_VIDEO" ? 10 : null,
    });
  }
}

async function approveProject(
  db: ReturnType<typeof createDb>,
  input: {
    owner: string;
    workspaceId: string;
    businessId: string;
    title: string;
  },
) {
  const member = await requireWorkspaceMember(db, input.owner, input.workspaceId);
  const projectId = await createDraftProject(db, member, {
    businessId: input.businessId,
    createdByUserId: input.owner,
    title: input.title,
  });
  await updateDraftBrief(db, member, projectId, {
    objective: "Service",
    ctaType: "Call",
    ctaValue: "021 000 0000",
    style: "Cinematic",
    platform: "TikTok",
    aspectRatio: "9:16",
    duration: 30,
  });
  const concept = await generateConceptForProject(db, {
    projectId,
    workspaceId: input.workspaceId,
    userId: input.owner,
    provider: createMockCreativeDirector(),
  });
  await approveConcept(db, {
    projectId,
    workspaceId: input.workspaceId,
    userId: input.owner,
    versionId: concept.versionId,
  });
  return projectId;
}

function eventOrder(types: string[], expected: string[]) {
  let last = -1;
  for (const type of expected) {
    const index = types.indexOf(type);
    assert.ok(index > last, `missing or out of order: ${type}`);
    last = index;
  }
}

test("customer production labels never name vendors", () => {
  assert.equal(customerProductionLabel("SEEDANCE_QUEUED"), CUSTOMER_PRODUCTION_STAGE.filming);
  assert.equal(customerProductionLabel("SEEDANCE_PROCESSING"), CUSTOMER_PRODUCTION_STAGE.filming);
  assert.equal(customerProductionLabel("TOPAZ_PROCESSING"), CUSTOMER_PRODUCTION_STAGE.enhancing);
  assert.equal(customerProductionLabel("BRANDING"), CUSTOMER_PRODUCTION_STAGE.branding);
  assert.equal(customerProductionLabel("FINALISING"), CUSTOMER_PRODUCTION_STAGE.finalising);
  assert.equal(customerProductionLabel("COMPLETE"), CUSTOMER_PRODUCTION_STAGE.ready);
  assert.doesNotMatch(JSON.stringify(CUSTOMER_PRODUCTION_STAGE), /Seedance|Topaz|FFmpeg|fal\.ai/i);
});

test("mock production spends one credit, writes R2, and resumes memoized steps", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const bucket = proxy.env.MEDIA_BUCKET as R2Bucket;
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase15.${stamp}@cineyou.test`, "Owner Fifteen");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Fifteen ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour Films ${stamp}`, industry: "law firm" },
  });
  await db
    .update(businesses)
    .set({ industry: "law firm" })
    .where(eq(businesses.id, studio.businessId));
  await seedIdentity(db, bucket, studio.workspaceId, owner);

  const readyId = await approveProject(db, {
    owner,
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    title: "Harbour launch",
  });

  await assert.rejects(
    () =>
      startProduction(
        db,
        { projectId: readyId, workspaceId: studio.workspaceId, userId: owner },
        {
          db,
          bucket,
          video: createMockVideoProvider(),
          upscale: createMockUpscaleProvider(),
          branding: createMockBrandingProvider(),
          startWorkflow: async () => ({ id: "unused" }),
        },
      ),
    (error: unknown) => error instanceof ProductionError && error.code === "NO_CREDITS",
  );

  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 1,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-success`,
    description: "Test production credit",
  });

  const innerVideo = createMockVideoProvider();
  let submits = 0;
  const video = {
    submit: async (input: Parameters<typeof innerVideo.submit>[0]) => {
      submits += 1;
      return innerVideo.submit(input);
    },
    getStatus: innerVideo.getStatus.bind(innerVideo),
    getResult: innerVideo.getResult.bind(innerVideo),
  };
  const deps: PipelineDeps = {
    db,
    bucket,
    video,
    upscale: createMockUpscaleProvider(),
    branding: createMockBrandingProvider(),
    enqueueEmail: async () => {
      throw new Error("QUEUE_FAILED");
    },
  };
  const step = memoStep();
  let captured: ProductionParams | undefined;
  let walletAtCreate = -1;
  let generationBeforeCreate = false;

  const started = await startProduction(
    db,
    { projectId: readyId, workspaceId: studio.workspaceId, userId: owner },
    {
      ...deps,
      startWorkflow: async (params) => {
        captured = params;
        walletAtCreate = await getWalletBalance(db, studio.workspaceId);
        const [generation] = await db
          .select()
          .from(creditTransactions)
          .where(eq(creditTransactions.idempotencyKey, generationIdempotencyKey(params.projectId, params.attemptId)));
        generationBeforeCreate = Boolean(generation);
        await runCommercialProduction(deps, params, step);
        return { id: params.jobId };
      },
    },
  );

  assert.equal(walletAtCreate, 0);
  assert.equal(generationBeforeCreate, true);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);
  assert.equal(submits, 1);
  assert.match(started.productionPath, /\/production$/);

  const job = await getJobById(db, started.jobId);
  assert.equal(job?.status, "COMPLETE");
  assert.ok(job?.sourceAssetId);
  assert.ok(job?.enhancedAssetId);
  assert.ok(job?.finalAssetId);

  const [project] = await db.select().from(projects).where(eq(projects.id, readyId)).limit(1);
  assert.equal(project?.status, "READY");

  const files = await db.select().from(assets).where(eq(assets.projectId, readyId));
  const roles = new Set(files.map((row) => row.role));
  assert.ok(roles.has("source"));
  assert.ok(roles.has("enhanced"));
  assert.ok(roles.has("master"));
  assert.ok(roles.has("thumbnail"));
  for (const file of files) {
    const stored = await getWorkspaceObject(bucket, studio.workspaceId, file.r2ObjectKey);
    assert.ok(stored, file.r2ObjectKey);
  }

  const events = await db
    .select({ type: productionEvents.type })
    .from(productionEvents)
    .where(eq(productionEvents.jobId, started.jobId));
  eventOrder(
    events.map((row) => row.type),
    [
      "JOB_CREATED",
      "CREDIT_RESERVED",
      "SEEDANCE_SUBMITTED",
      "SEEDANCE_COMPLETE",
      "SOURCE_SAVED",
      "TOPAZ_SUBMITTED",
      "TOPAZ_COMPLETE",
      "ENHANCED_SAVED",
      "BRANDING_STARTED",
      "FINAL_SAVED",
      "COMPLETE",
    ],
  );

  const readyNotices = await db
    .select()
    .from(notifications)
    .where(eq(notifications.workspaceId, studio.workspaceId));
  assert.ok(readyNotices.some((row) => row.title === READY_TITLE));

  assert.ok(captured);
  await runCommercialProduction(deps, captured, step);
  assert.equal(submits, 1);

  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 1,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-dup`,
    description: "Duplicate guard credit",
  });
  const duplicateId = await approveProject(db, {
    owner,
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    title: "Harbour follow-up",
  });
  const inFlightDeps: PipelineDeps & { startWorkflow: () => Promise<{ id: string }> } = {
    db,
    bucket,
    video: createMockVideoProvider(),
    upscale: createMockUpscaleProvider(),
    branding: createMockBrandingProvider(),
    startWorkflow: async () => ({ id: "held" }),
  };
  await startProduction(
    db,
    { projectId: duplicateId, workspaceId: studio.workspaceId, userId: owner },
    inFlightDeps,
  );
  await assert.rejects(
    () =>
      startProduction(
        db,
        { projectId: duplicateId, workspaceId: studio.workspaceId, userId: owner },
        inFlightDeps,
      ),
    (error: unknown) => error instanceof ProductionError && error.code === "DUPLICATE",
  );
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 1,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-fail`,
    description: "Failure refund credit",
  });
  const failId = await approveProject(db, {
    owner,
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    title: "Harbour retry",
  });
  const failing: PipelineDeps = {
    db,
    bucket,
    video: createMockVideoProvider({ failure: "submit" }),
    upscale: createMockUpscaleProvider(),
    branding: createMockBrandingProvider(),
  };
  await assert.rejects(
    () =>
      startProduction(
        db,
        { projectId: failId, workspaceId: studio.workspaceId, userId: owner },
        {
          ...failing,
          startWorkflow: async (params) => {
            await runCommercialProduction(failing, params, memoStep());
            return { id: params.jobId };
          },
        },
      ),
    (error: unknown) =>
      error instanceof ProductionError &&
      error.code === "FAILED" &&
      error.message === CUSTOMER_FAILURE &&
      !/seedance|topaz|ffmpeg|fal|reapi/i.test(error.message),
  );
  const failedJobs = await db.select().from(projects).where(eq(projects.id, failId)).limit(1);
  assert.equal(failedJobs[0]?.status, "FAILED");
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);
  const failedNotices = await db
    .select()
    .from(notifications)
    .where(eq(notifications.workspaceId, studio.workspaceId));
  assert.ok(failedNotices.some((row) => row.type === "production_failed"));
  assert.ok(failedNotices.some((row) => row.type === "credit_refunded"));
});

function failPuts(bucket: R2Bucket): R2Bucket {
  return new Proxy(bucket, {
    get(target, prop, receiver) {
      if (prop === "put") {
        return async () => {
          throw new Error("R2_PUT_FAILED");
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

test("Topaz, branding, and R2 save failures refund once without vendor names", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const bucket = proxy.env.MEDIA_BUCKET as R2Bucket;
  const stamp = Date.now() + 7;
  const owner = await insertPerson(db, `phase24.${stamp}@cineyou.test`, "Owner TwentyFour");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase TwentyFour ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour Fail ${stamp}`, industry: "law firm" },
  });
  await db
    .update(businesses)
    .set({ industry: "law firm" })
    .where(eq(businesses.id, studio.businessId));
  await seedIdentity(db, bucket, studio.workspaceId, owner);
  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 3,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-failures`,
  });

  const cases: Array<{ title: string; deps: PipelineDeps }> = [
    {
      title: "Enhance fail",
      deps: {
        db,
        bucket,
        video: createMockVideoProvider(),
        upscale: createMockUpscaleProvider({ failure: "create" }),
        branding: createMockBrandingProvider(),
      },
    },
    {
      title: "Brand fail",
      deps: {
        db,
        bucket,
        video: createMockVideoProvider(),
        upscale: createMockUpscaleProvider(),
        branding: createMockBrandingProvider({ failure: true }),
      },
    },
    {
      title: "Save fail",
      deps: {
        db,
        bucket: failPuts(bucket),
        video: createMockVideoProvider(),
        upscale: createMockUpscaleProvider(),
        branding: createMockBrandingProvider(),
      },
    },
  ];

  for (const item of cases) {
    const projectId = await approveProject(db, {
      owner,
      workspaceId: studio.workspaceId,
      businessId: studio.businessId,
      title: item.title,
    });
    const before = await getWalletBalance(db, studio.workspaceId);
    await assert.rejects(
      () =>
        startProduction(
          db,
          { projectId, workspaceId: studio.workspaceId, userId: owner },
          {
            ...item.deps,
            startWorkflow: async (params) => {
              await runCommercialProduction(item.deps, params, memoStep());
              return { id: params.jobId };
            },
          },
        ),
      (error: unknown) =>
        error instanceof ProductionError &&
        error.code === "FAILED" &&
        error.message === CUSTOMER_FAILURE &&
        !/seedance|topaz|ffmpeg|fal|reapi|r2/i.test(error.message),
    );
    assert.equal(await getWalletBalance(db, studio.workspaceId), before);
  }
});
