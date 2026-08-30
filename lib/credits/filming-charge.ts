import type { Db } from "@/lib/db/client";
import type { VideoGenerationProvider } from "@/lib/providers/video/seedance";
import {
  FILMING_CHARGED_DESCRIPTION,
  filmingChargedIdempotencyKey,
  technicalRefundIdempotencyKey,
} from "./copy";
import { deductCredits, getCreditTransactionByKey } from "./ledger";

export function isLiveFilmingTaskId(id: string | null | undefined): boolean {
  return Boolean(id && !id.startsWith("mock-"));
}

export async function shouldRefundAfterFilmingFailure(
  video: VideoGenerationProvider,
  videoProviderJobId: string | null | undefined,
): Promise<boolean> {
  if (!isLiveFilmingTaskId(videoProviderJobId)) {
    return true;
  }
  const status = await video.getStatus(videoProviderJobId!).catch(() => ({ status: "processing" as const }));
  return status.status === "failed";
}

export async function reclaimRefundIfFilmingCharged(
  db: Db,
  input: { workspaceId: string; generationIdempotencyKey: string },
) {
  const refund = await getCreditTransactionByKey(db, technicalRefundIdempotencyKey(input.generationIdempotencyKey));
  if (!refund) {
    return null;
  }
  return deductCredits(db, {
    workspaceId: input.workspaceId,
    amount: 1,
    idempotencyKey: filmingChargedIdempotencyKey(input.generationIdempotencyKey),
    description: FILMING_CHARGED_DESCRIPTION,
  }).catch(() => null);
}
