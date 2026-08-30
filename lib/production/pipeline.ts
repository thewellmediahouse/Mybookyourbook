import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, projects } from "@/lib/db/schema";
import { refundTechnicalFailure } from "@/lib/credits/ledger";
import { generationIdempotencyKey } from "@/lib/credits/copy";
import { reclaimRefundIfFilmingCharged, shouldRefundAfterFilmingFailure } from "@/lib/credits/filming-charge";
import { getBrand, getBrandLogoAsset } from "@/lib/businesses/queries";
import { CUSTOMER_FAILURE, CUSTOMER_FAILURE_CHARGED, REFERENCE_VIDEO_FORMAT } from "./copy";
import { appendProductionEvent, setJobStatus } from "./events";
import { insertProductionAsset } from "./assets";
import { getJobById } from "./queries";
import { newId } from "@/lib/id";
import { productionObjectKey } from "@/lib/r2/keys";
import { getWorkspaceObject, putWorkspaceObject } from "@/lib/r2/bucket";
import type { BrandingProvider } from "@/lib/providers/branding";
import { resolveLogoPosition } from "@/lib/providers/branding";
import type { UpscaleProvider } from "@/lib/providers/upscale/topaz";
import type { VideoGenerationProvider } from "@/lib/providers/video/seedance";
import { getIdentityBundle } from "@/lib/identity/queries";
import { IDENTITY_SLOTS } from "@/lib/identity/slots";
import { resolveFilmingPrompt } from "@/lib/creative/prompt";
import { buildVideoSubmitInput } from "./references";
import type { EmailQueueMessage } from "@/lib/notifications/messages";
import { notifyProductionComplete, notifyProductionFailed } from "@/lib/notifications/notify";

export type ProductionParams = {
  jobId: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  businessId: string;
  creativeVersionId: string;
  attemptId: string;
};

export type StepRetry = { limit: number };

export type DurableStep = {
  do<T>(name: string, callback: () => Promise<T>, retry?: StepRetry): Promise<T>;
  sleep(name: string, duration: string): Promise<void>;
};

export type PipelineDeps = {
  db: Db;
  bucket: R2Bucket;
  video: VideoGenerationProvider;
  upscale: UpscaleProvider;
  branding: BrandingProvider;
  appUrl?: string;
  enqueueEmail?: (message: EmailQueueMessage) => Promise<void>;
  signGetUrl?: (objectKey: string) => Promise<string>;
  requireReferenceUrls?: boolean;
};

const SEEDANCE_STATUS_ATTEMPTS = 180;
const TOPAZ_STATUS_ATTEMPTS = 120;
const ENHANCE_UNAVAILABLE = "We couldn't enhance your footage right now. Please try again later.";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sideEffectSink(deps: PipelineDeps) {
  return {
    appUrl: deps.appUrl ?? "http://localhost:3000",
    enqueueEmail: deps.enqueueEmail,
  };
}

export async function failProductionJob(
  db: Db,
  params: ProductionParams,
  error: unknown,
  refunded: boolean,
  sink?: { appUrl: string; enqueueEmail?: (message: EmailQueueMessage) => Promise<void> },
) {
  const internal = toErrorMessage(error);
  const customerMessage =
    internal === "REFERENCE_VIDEO_FORMAT"
      ? REFERENCE_VIDEO_FORMAT
      : refunded
        ? CUSTOMER_FAILURE
        : CUSTOMER_FAILURE_CHARGED;
  await setJobStatus(db, {
    jobId: params.jobId,
    projectId: params.projectId,
    status: "FAILED",
    patch: {
      failureType: "provider",
      failureCode: internal.slice(0, 80),
      internalFailureMessage: internal,
      customerFailureMessage: customerMessage,
    },
  });
  await appendProductionEvent(db, { jobId: params.jobId, type: "FAILED", payload: { refunded } });
  if (refunded) {
    await appendProductionEvent(db, { jobId: params.jobId, type: "CREDIT_REFUNDED" });
  }
  await notifyProductionFailed(
    db,
    {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      jobId: params.jobId,
      producerUserId: params.userId,
      refunded,
    },
    sink ?? { appUrl: "http://localhost:3000" },
  );
}

export async function runCommercialProduction(
  deps: PipelineDeps,
  params: ProductionParams,
  step: DurableStep,
): Promise<{ finalAssetId: string }> {
  try {
    await step.do("validate-project", async () => {
      const job = await getJobById(deps.db, params.jobId);
      if (!job || job.projectId !== params.projectId) {
        throw new Error("JOB_MISSING");
      }
      return true;
    });

    await step.do("validate-identity", async () => {
      const identity = await getIdentityBundle(deps.db, params.workspaceId, params.userId);
      if (!identity) {
        throw new Error("IDENTITY_MISSING");
      }
      for (const slot of IDENTITY_SLOTS) {
        if (!identity.assets[slot]) {
          throw new Error("IDENTITY_INCOMPLETE");
        }
      }
      return identity.identityId;
    });

    await step.do("validate-consent", async () => {
      const identity = await getIdentityBundle(deps.db, params.workspaceId, params.userId);
      if (!identity?.consented) {
        throw new Error("CONSENT_MISSING");
      }
      return true;
    });

    const prior = await step.do("load-existing-outputs", async () => {
      const job = await getJobById(deps.db, params.jobId);
      if (job?.status === "CANCELLED") {
        throw new Error("JOB_CANCELLED");
      }
      return {
        sourceAssetId: job?.sourceAssetId ?? null,
        enhancedAssetId: job?.enhancedAssetId ?? null,
        finalAssetId: job?.finalAssetId ?? null,
        videoProviderJobId: job?.videoProviderJobId ?? null,
      };
    });
    if (prior.finalAssetId) {
      return { finalAssetId: prior.finalAssetId };
    }

    let sourceAssetId = prior.sourceAssetId;
    let enhancedAssetId = prior.enhancedAssetId;

    if (!enhancedAssetId && !sourceAssetId) {
      const submitInput = prior.videoProviderJobId
        ? null
        : await step.do(
            "prepare-references",
            async () => {
              const prompt = await resolveFilmingPrompt(deps.db, {
                projectId: params.projectId,
                creativeVersionId: params.creativeVersionId,
              });
              return buildVideoSubmitInput(deps.db, {
                projectId: params.projectId,
                workspaceId: params.workspaceId,
                userId: params.userId,
                prompt,
                signGetUrl: deps.signGetUrl,
                requireReferenceUrls: deps.requireReferenceUrls,
              });
            },
            { limit: 0 },
          );

      const videoJobId = await step.do("submit-seedance", async () => {
        const existing = (await getJobById(deps.db, params.jobId))?.videoProviderJobId;
        if (existing) {
          await setJobStatus(deps.db, {
            jobId: params.jobId,
            projectId: params.projectId,
            status: "SEEDANCE_PROCESSING",
          });
          return existing;
        }
        if (!submitInput) {
          throw new Error("PROMPT_MISSING");
        }
        await setJobStatus(deps.db, {
          jobId: params.jobId,
          projectId: params.projectId,
          status: "SEEDANCE_QUEUED",
        });
        const submitted = await deps.video.submit(submitInput);
        await setJobStatus(deps.db, {
          jobId: params.jobId,
          projectId: params.projectId,
          status: "SEEDANCE_PROCESSING",
          patch: { videoProvider: "seedance", videoProviderJobId: submitted.id },
        });
        await appendProductionEvent(deps.db, {
          jobId: params.jobId,
          type: "SEEDANCE_SUBMITTED",
          payload: { id: submitted.id },
        });
        return submitted.id;
      });

      await waitUntilComplete(deps, params, step, (id) => deps.video.getStatus(id), videoJobId, {
        attempts: SEEDANCE_STATUS_ATTEMPTS,
        statusPrefix: "seedance-status",
        waitPrefix: "seedance-wait",
        completeStatus: "SEEDANCE_COMPLETE",
        completeEvent: "SEEDANCE_COMPLETE",
        failedMessage: "SEEDANCE_FAILED",
        timeoutMessage: "SEEDANCE_TIMEOUT",
      });

      sourceAssetId = await step.do("save-source-r2", async () => {
        const result = await deps.video.getResult(videoJobId);
        const assetId = await saveStageAsset(deps, params, {
          kind: "source",
          bytes: result.bytes,
          mimeType: result.mimeType,
          nextStatus: "TOPAZ_PREPARING",
          event: "SOURCE_SAVED",
        });
        await reclaimRefundIfFilmingCharged(deps.db, {
          workspaceId: params.workspaceId,
          generationIdempotencyKey: generationIdempotencyKey(params.projectId, params.attemptId),
        });
        return assetId;
      });
    }

    if (!enhancedAssetId) {
      if (!sourceAssetId) {
        throw new Error("SOURCE_MISSING");
      }
      const filmedId = sourceAssetId;
      const upscaleSubmit = await step.do("submit-topaz", async () => {
        const source = await readAssetBytes(deps, params.workspaceId, filmedId);
        const [project] = await deps.db
          .select({ aspectRatio: projects.aspectRatio, duration: projects.duration })
          .from(projects)
          .where(eq(projects.id, params.projectId))
          .limit(1);
        const aspectRatio = project?.aspectRatio?.trim() || "";
        if (!aspectRatio) {
          throw new Error("ASPECT_MISSING");
        }
        const created = await deps.upscale.create({
          sourceBytes: source.bytes,
          mimeType: source.mimeType,
          aspectRatio,
          durationSeconds: project?.duration ?? 30,
        });
        const accepted = await deps.upscale.accept(created.id);
        await setJobStatus(deps.db, {
          jobId: params.jobId,
          projectId: params.projectId,
          status: "TOPAZ_UPLOADING",
          patch: { upscaleProvider: "topaz", upscaleProviderJobId: created.id },
        });
        await appendProductionEvent(deps.db, {
          jobId: params.jobId,
          type: "TOPAZ_SUBMITTED",
          payload: { id: created.id },
        });
        return { id: created.id, uploadUrls: accepted.uploadUrls ?? [] };
      });

      await step.do("upload-topaz", async () => {
        const source = await readAssetBytes(deps, params.workspaceId, filmedId);
        await deps.upscale.upload(upscaleSubmit.id, source.bytes, upscaleSubmit.uploadUrls);
        await deps.upscale.completeUpload(upscaleSubmit.id);
        await setJobStatus(deps.db, {
          jobId: params.jobId,
          projectId: params.projectId,
          status: "TOPAZ_PROCESSING",
        });
        return true;
      });

      await waitUntilComplete(deps, params, step, (id) => deps.upscale.poll(id), upscaleSubmit.id, {
        attempts: TOPAZ_STATUS_ATTEMPTS,
        statusPrefix: "topaz-status",
        waitPrefix: "topaz-wait",
        completeStatus: "TOPAZ_COMPLETE",
        completeEvent: "TOPAZ_COMPLETE",
        failedMessage: ENHANCE_UNAVAILABLE,
        timeoutMessage: ENHANCE_UNAVAILABLE,
      });

      enhancedAssetId = await step.do("save-enhanced-r2", async () => {
        const result = await deps.upscale.retrieve(upscaleSubmit.id);
        return saveStageAsset(deps, params, {
          kind: "enhanced",
          bytes: result.bytes,
          mimeType: result.mimeType,
          nextStatus: "BRANDING",
          event: "ENHANCED_SAVED",
        });
      });
    }

    if (!enhancedAssetId) {
      throw new Error("ENHANCED_MISSING");
    }
    const brandedAssetId = enhancedAssetId;

    const branded = await step.do("branding", async () => {
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: "BRANDING_STARTED" });
      const [enhanced] = await deps.db
        .select({ objectKey: assets.r2ObjectKey, mimeType: assets.mimeType })
        .from(assets)
        .where(eq(assets.id, brandedAssetId))
        .limit(1);
      if (!enhanced?.objectKey) {
        throw new Error("ENHANCED_MISSING");
      }
      const enhancedObject = await getWorkspaceObject(deps.bucket, params.workspaceId, enhanced.objectKey);
      if (!enhancedObject) {
        throw new Error("ENHANCED_MISSING");
      }
      const sourceBytes = new Uint8Array(await enhancedObject.arrayBuffer());
      const brand = await getBrand(deps.db, params.businessId);
      const logo = await getBrandLogoAsset(deps.db, params.businessId);
      let logoBytes: Uint8Array | null = null;
      if (logo?.r2ObjectKey) {
        const logoObject = await getWorkspaceObject(deps.bucket, params.workspaceId, logo.r2ObjectKey);
        if (logoObject) {
          logoBytes = new Uint8Array(await logoObject.arrayBuffer());
        }
      }
      const result = await deps.branding.apply({
        sourceBytes,
        mimeType: enhanced.mimeType,
        businessName: brand?.name ?? "Studio",
        ctaValue: brand?.defaultCta,
        phone: brand?.phone,
        website: brand?.website,
        whatsapp: brand?.whatsapp,
        logoPosition: resolveLogoPosition(brand?.defaultLogoPosition),
        logoBytes,
        logoMimeType: logo?.mimeType,
        jobId: params.jobId,
      });
      const objectId = newId();
      const objectKey = productionObjectKey(params.workspaceId, params.projectId, "final", objectId);
      await putWorkspaceObject(deps.bucket, {
        workspaceId: params.workspaceId,
        objectKey,
        body: result.bytes,
        mimeType: result.mimeType,
      });
      const thumbId = newId();
      const thumbKey = productionObjectKey(params.workspaceId, params.projectId, "thumbnail", thumbId);
      await putWorkspaceObject(deps.bucket, {
        workspaceId: params.workspaceId,
        objectKey: thumbKey,
        body: result.thumbnailBytes,
        mimeType: result.thumbnailMimeType,
      });
      await setJobStatus(deps.db, {
        jobId: params.jobId,
        projectId: params.projectId,
        status: "FINALISING",
      });
      return {
        objectKey,
        mimeType: result.mimeType,
        sizeBytes: result.bytes.byteLength,
        thumbKey,
        thumbMimeType: result.thumbnailMimeType,
        thumbSizeBytes: result.thumbnailBytes.byteLength,
        width: result.media.width,
        height: result.media.height,
        durationSeconds: result.media.durationSeconds,
        fps: result.media.fps,
        videoCodec: result.media.videoCodec,
        audioCodec: result.media.audioCodec,
      };
    });

    const finalAssetId = await step.do("save-final-r2", async () => {
      const assetId = await insertProductionAsset(deps.db, {
        workspaceId: params.workspaceId,
        userId: params.userId,
        businessId: params.businessId,
        projectId: params.projectId,
        kind: "final",
        objectKey: branded.objectKey,
        mimeType: branded.mimeType,
        sizeBytes: branded.sizeBytes,
        width: branded.width,
        height: branded.height,
        durationSeconds: branded.durationSeconds,
        fps: branded.fps,
        videoCodec: branded.videoCodec,
        audioCodec: branded.audioCodec,
      });
      await insertProductionAsset(deps.db, {
        workspaceId: params.workspaceId,
        userId: params.userId,
        businessId: params.businessId,
        projectId: params.projectId,
        kind: "thumbnail",
        objectKey: branded.thumbKey,
        mimeType: branded.thumbMimeType,
        sizeBytes: branded.thumbSizeBytes,
      });
      await setJobStatus(deps.db, {
        jobId: params.jobId,
        projectId: params.projectId,
        status: "COMPLETE",
        patch: { finalAssetId: assetId },
      });
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: "FINAL_SAVED" });
      return assetId;
    });

    await step.do("notify", async () => {
      await notifyProductionComplete(
        deps.db,
        {
          workspaceId: params.workspaceId,
          projectId: params.projectId,
          jobId: params.jobId,
          producerUserId: params.userId,
        },
        sideEffectSink(deps),
      );
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: "COMPLETE" });
      return true;
    });

    return { finalAssetId };
  } catch (error) {
    const current = await getJobById(deps.db, params.jobId);
    if (current?.status === "CANCELLED" || toErrorMessage(error) === "JOB_CANCELLED") {
      throw error;
    }
    const refundCustomer = await shouldRefundAfterFilmingFailure(deps.video, current?.videoProviderJobId);
    const refund = refundCustomer
      ? await refundTechnicalFailure(deps.db, {
          workspaceId: params.workspaceId,
          generationIdempotencyKey: generationIdempotencyKey(params.projectId, params.attemptId),
        }).catch(() => null)
      : null;
    await failProductionJob(deps.db, params, error, Boolean(refund), sideEffectSink(deps));
    throw error;
  }
}

async function readAssetBytes(deps: PipelineDeps, workspaceId: string, assetId: string) {
  const [row] = await deps.db
    .select({ objectKey: assets.r2ObjectKey, mimeType: assets.mimeType })
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);
  if (!row?.objectKey) {
    throw new Error("SOURCE_MISSING");
  }
  const object = await getWorkspaceObject(deps.bucket, workspaceId, row.objectKey);
  if (!object) {
    throw new Error("SOURCE_MISSING");
  }
  return { bytes: new Uint8Array(await object.arrayBuffer()), mimeType: row.mimeType };
}

async function saveStageAsset(
  deps: PipelineDeps,
  params: ProductionParams,
  input: {
    kind: "source" | "enhanced";
    bytes: Uint8Array;
    mimeType: string;
    nextStatus: "TOPAZ_PREPARING" | "BRANDING";
    event: "SOURCE_SAVED" | "ENHANCED_SAVED";
  },
) {
  const objectId = newId();
  const objectKey = productionObjectKey(params.workspaceId, params.projectId, input.kind, objectId);
  await putWorkspaceObject(deps.bucket, {
    workspaceId: params.workspaceId,
    objectKey,
    body: input.bytes,
    mimeType: input.mimeType,
  });
  const assetId = await insertProductionAsset(deps.db, {
    workspaceId: params.workspaceId,
    userId: params.userId,
    businessId: params.businessId,
    projectId: params.projectId,
    kind: input.kind,
    objectKey,
    mimeType: input.mimeType,
    sizeBytes: input.bytes.byteLength,
  });
  await setJobStatus(deps.db, {
    jobId: params.jobId,
    projectId: params.projectId,
    status: input.nextStatus,
    patch: input.kind === "source" ? { sourceAssetId: assetId } : { enhancedAssetId: assetId },
  });
  await appendProductionEvent(deps.db, { jobId: params.jobId, type: input.event });
  return assetId;
}

async function waitUntilComplete(
  deps: PipelineDeps,
  params: ProductionParams,
  step: DurableStep,
  poll: (id: string) => Promise<{ status: string; error?: string }>,
  providerJobId: string,
  options: {
    attempts: number;
    statusPrefix: string;
    waitPrefix: string;
    completeStatus: "SEEDANCE_COMPLETE" | "TOPAZ_COMPLETE";
    completeEvent: "SEEDANCE_COMPLETE" | "TOPAZ_COMPLETE";
    failedMessage: string;
    timeoutMessage: string;
  },
) {
  for (let attempt = 0; attempt < options.attempts; attempt += 1) {
    const status = await step.do(`${options.statusPrefix}-${attempt}`, async () => poll(providerJobId));
    if (status.status === "complete") {
      await setJobStatus(deps.db, {
        jobId: params.jobId,
        projectId: params.projectId,
        status: options.completeStatus,
      });
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: options.completeEvent });
      return;
    }
    if (status.status === "failed") {
      throw new Error(status.error ?? options.failedMessage);
    }
    await step.sleep(`${options.waitPrefix}-${attempt}`, "15 seconds");
  }
  throw new Error(options.timeoutMessage);
}

export function immediateStep(): DurableStep {
  return {
    async do<T>(_name: string, callback: () => Promise<T>): Promise<T> {
      return callback();
    },
    async sleep() {
      return;
    },
  };
}

export function memoStep(): DurableStep {
  const cache = new Map<string, unknown>();
  return {
    async do<T>(name: string, callback: () => Promise<T>): Promise<T> {
      if (cache.has(name)) {
        return cache.get(name) as T;
      }
      const value = await callback();
      cache.set(name, value);
      return value;
    },
    async sleep() {
      return;
    },
  };
}
