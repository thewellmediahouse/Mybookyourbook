import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, creativeVersions } from "@/lib/db/schema";
import { refundTechnicalFailure } from "@/lib/credits/ledger";
import { generationIdempotencyKey } from "@/lib/credits/copy";
import { getBrand, getBrandLogoAsset } from "@/lib/businesses/queries";
import { CUSTOMER_FAILURE } from "./copy";
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

export type DurableStep = {
  do<T>(name: string, callback: () => Promise<T>): Promise<T>;
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

const SEEDANCE_STATUS_ATTEMPTS = 60;
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
  await setJobStatus(db, {
    jobId: params.jobId,
    projectId: params.projectId,
    status: "FAILED",
    patch: {
      failureType: "provider",
      failureCode: internal.slice(0, 80),
      internalFailureMessage: internal,
      customerFailureMessage: CUSTOMER_FAILURE,
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
      };
    });
    if (prior.finalAssetId) {
      return { finalAssetId: prior.finalAssetId };
    }

    const submitInput = await step.do("prepare-references", async () => {
      const [version] = await deps.db
        .select({ seedancePrompt: creativeVersions.seedancePrompt })
        .from(creativeVersions)
        .where(eq(creativeVersions.id, params.creativeVersionId))
        .limit(1);
      if (!version?.seedancePrompt) {
        throw new Error("PROMPT_MISSING");
      }
      return buildVideoSubmitInput(deps.db, {
        projectId: params.projectId,
        workspaceId: params.workspaceId,
        userId: params.userId,
        prompt: version.seedancePrompt,
        signGetUrl: deps.signGetUrl,
        requireReferenceUrls: deps.requireReferenceUrls,
      });
    });

    let sourceBytes: { bytes: number[]; mimeType: string } | null = null;
    let sourceAssetId = prior.sourceAssetId;
    let enhancedAssetId = prior.enhancedAssetId;

    if (!enhancedAssetId && !sourceAssetId) {
      const videoJobId = await step.do("submit-seedance", async () => {
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

      sourceBytes = await waitForSeedanceSource(deps, params, step, videoJobId);

      sourceAssetId = await step.do("save-source-r2", async () => {
        const objectId = newId();
        const objectKey = productionObjectKey(params.workspaceId, params.projectId, "source", objectId);
        const bytes = Uint8Array.from(sourceBytes!.bytes);
        await putWorkspaceObject(deps.bucket, {
          workspaceId: params.workspaceId,
          objectKey,
          body: bytes,
          mimeType: sourceBytes!.mimeType,
        });
        const assetId = await insertProductionAsset(deps.db, {
          workspaceId: params.workspaceId,
          userId: params.userId,
          businessId: params.businessId,
          projectId: params.projectId,
          kind: "source",
          objectKey,
          mimeType: sourceBytes!.mimeType,
          sizeBytes: bytes.byteLength,
        });
        await setJobStatus(deps.db, {
          jobId: params.jobId,
          projectId: params.projectId,
          status: "TOPAZ_PREPARING",
          patch: { sourceAssetId: assetId },
        });
        await appendProductionEvent(deps.db, { jobId: params.jobId, type: "SOURCE_SAVED" });
        return assetId;
      });
    } else if (!enhancedAssetId && sourceAssetId) {
      sourceBytes = await step.do("load-source-r2", async () => {
        const [row] = await deps.db
          .select({ objectKey: assets.r2ObjectKey, mimeType: assets.mimeType })
          .from(assets)
          .where(eq(assets.id, sourceAssetId as string))
          .limit(1);
        if (!row?.objectKey) {
          throw new Error("SOURCE_MISSING");
        }
        const object = await getWorkspaceObject(deps.bucket, params.workspaceId, row.objectKey);
        if (!object) {
          throw new Error("SOURCE_MISSING");
        }
        return { bytes: Array.from(new Uint8Array(await object.arrayBuffer())), mimeType: row.mimeType };
      });
    }

    if (!enhancedAssetId) {
      if (!sourceBytes) {
        throw new Error("SOURCE_MISSING");
      }
      const source = sourceBytes;
      const upscaleSubmit = await step.do("submit-topaz", async () => {
        const created = await deps.upscale.create({
          sourceBytes: Uint8Array.from(source.bytes),
          mimeType: source.mimeType,
          aspectRatio: submitInput.aspectRatio,
          durationSeconds: submitInput.durationSeconds,
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
        await deps.upscale.upload(upscaleSubmit.id, Uint8Array.from(source.bytes), upscaleSubmit.uploadUrls);
        await deps.upscale.completeUpload(upscaleSubmit.id);
        await setJobStatus(deps.db, {
          jobId: params.jobId,
          projectId: params.projectId,
          status: "TOPAZ_PROCESSING",
        });
        return true;
      });

      const enhancedBytes = await waitForTopazEnhanced(deps, params, step, upscaleSubmit.id);

      enhancedAssetId = await step.do("save-enhanced-r2", async () => {
      const objectId = newId();
      const objectKey = productionObjectKey(params.workspaceId, params.projectId, "enhanced", objectId);
      const bytes = Uint8Array.from(enhancedBytes.bytes);
      await putWorkspaceObject(deps.bucket, {
        workspaceId: params.workspaceId,
        objectKey,
        body: bytes,
        mimeType: enhancedBytes.mimeType,
      });
      const assetId = await insertProductionAsset(deps.db, {
        workspaceId: params.workspaceId,
        userId: params.userId,
        businessId: params.businessId,
        projectId: params.projectId,
        kind: "enhanced",
        objectKey,
        mimeType: enhancedBytes.mimeType,
        sizeBytes: bytes.byteLength,
      });
      await setJobStatus(deps.db, {
        jobId: params.jobId,
        projectId: params.projectId,
        status: "BRANDING",
        patch: { enhancedAssetId: assetId },
      });
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: "ENHANCED_SAVED" });
      return assetId;
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
    const refund = await refundTechnicalFailure(deps.db, {
      workspaceId: params.workspaceId,
      generationIdempotencyKey: generationIdempotencyKey(params.projectId, params.attemptId),
    }).catch(() => null);
    await failProductionJob(deps.db, params, error, Boolean(refund), sideEffectSink(deps));
    throw error;
  }
}

async function waitForSeedanceSource(
  deps: PipelineDeps,
  params: ProductionParams,
  step: DurableStep,
  videoJobId: string,
) {
  for (let attempt = 0; attempt < SEEDANCE_STATUS_ATTEMPTS; attempt += 1) {
    const status = await step.do(`seedance-status-${attempt}`, async () => deps.video.getStatus(videoJobId));
    if (status.status === "complete") {
      const result = await step.do("seedance-result", async () => deps.video.getResult(videoJobId));
      await setJobStatus(deps.db, {
        jobId: params.jobId,
        projectId: params.projectId,
        status: "SEEDANCE_COMPLETE",
      });
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: "SEEDANCE_COMPLETE" });
      return { bytes: Array.from(result.bytes), mimeType: result.mimeType };
    }
    if (status.status === "failed") {
      throw new Error(status.error ?? "SEEDANCE_FAILED");
    }
    await step.sleep(`seedance-wait-${attempt}`, "15 seconds");
  }
  throw new Error("SEEDANCE_TIMEOUT");
}

async function waitForTopazEnhanced(
  deps: PipelineDeps,
  params: ProductionParams,
  step: DurableStep,
  upscaleJobId: string,
) {
  for (let attempt = 0; attempt < TOPAZ_STATUS_ATTEMPTS; attempt += 1) {
    const status = await step.do(`topaz-status-${attempt}`, async () => deps.upscale.poll(upscaleJobId));
    if (status.status === "complete") {
      const result = await step.do("topaz-result", async () => deps.upscale.retrieve(upscaleJobId));
      await setJobStatus(deps.db, {
        jobId: params.jobId,
        projectId: params.projectId,
        status: "TOPAZ_COMPLETE",
      });
      await appendProductionEvent(deps.db, { jobId: params.jobId, type: "TOPAZ_COMPLETE" });
      return { bytes: Array.from(result.bytes), mimeType: result.mimeType };
    }
    if (status.status === "failed") {
      throw new Error(ENHANCE_UNAVAILABLE);
    }
    await step.sleep(`topaz-wait-${attempt}`, "15 seconds");
  }
  throw new Error(ENHANCE_UNAVAILABLE);
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
