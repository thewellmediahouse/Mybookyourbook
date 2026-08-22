import { getCloudflareContext } from "@opennextjs/cloudflare";
import { enqueueCleanup, type NotificationEnv } from "@/lib/notifications/queue";

export async function queueObjectCleanup(workspaceId: string, objectKey: string) {
  const { env } = await getCloudflareContext({ async: true });
  await enqueueCleanup(env as NotificationEnv, { workspaceId, objectKey });
}

export async function queueObjectCleanups(workspaceId: string, objectKeys: string[]) {
  for (const objectKey of objectKeys) {
    await queueObjectCleanup(workspaceId, objectKey);
  }
}
