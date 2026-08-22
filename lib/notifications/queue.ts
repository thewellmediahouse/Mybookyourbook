import { getEmailProvider } from "@/lib/providers/email";
import type { EmailQueueMessage, NotificationQueueMessage } from "./messages";
import { isCleanupQueueMessage, isEmailQueueMessage } from "./messages";
import { renderEmail } from "./templates";
import { deleteWorkspaceObject } from "@/lib/r2/bucket";
import { assertWorkspaceObjectKey, ObjectKeyError } from "@/lib/r2/keys";

export type NotificationEnv = {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NEXTJS_ENV?: string;
  NOTIFICATION_QUEUE?: Queue<NotificationQueueMessage>;
  CLEANUP_QUEUE?: Queue<{ kind: "cleanup"; workspaceId: string; objectKey: string }>;
  MEDIA_BUCKET?: R2Bucket;
};

export function shouldUseNotificationQueue(env: NotificationEnv): boolean {
  return Boolean(env.NOTIFICATION_QUEUE) && String(env.NEXTJS_ENV ?? "").toLowerCase() === "production";
}

export async function dispatchEmail(
  env: NotificationEnv,
  message: EmailQueueMessage,
  sendNow?: (message: EmailQueueMessage) => Promise<void>,
) {
  const deliver = sendNow ?? ((item: EmailQueueMessage) => sendQueuedEmail(item, env));
  if (shouldUseNotificationQueue(env) && env.NOTIFICATION_QUEUE) {
    await env.NOTIFICATION_QUEUE.send(message);
    return;
  }
  await deliver(message);
}

export async function sendQueuedEmail(message: EmailQueueMessage, env: NotificationEnv) {
  const rendered = renderEmail(message);
  await getEmailProvider(env).send({
    to: message.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: message.idempotencyKey,
  });
}

export async function handleQueueBatch(
  batch: { queue: string; messages: ReadonlyArray<{ body: unknown; ack: () => void; retry: () => void }> },
  env: NotificationEnv,
) {
  for (const item of batch.messages) {
    try {
      await handleQueueMessage(item.body, env);
      item.ack();
    } catch (error) {
      if (error instanceof ObjectKeyError) {
        item.ack();
        continue;
      }
      item.retry();
    }
  }
}

export async function handleQueueMessage(body: unknown, env: NotificationEnv) {
  if (isEmailQueueMessage(body)) {
    await sendQueuedEmail(body, env);
    return;
  }
  if (isCleanupQueueMessage(body)) {
    await handleCleanupMessage(body, env);
  }
}

async function handleCleanupMessage(
  message: { workspaceId: string; objectKey: string },
  env: NotificationEnv,
) {
  if (!env.MEDIA_BUCKET) {
    return;
  }
  assertWorkspaceObjectKey(message.objectKey, message.workspaceId);
  await deleteWorkspaceObject(env.MEDIA_BUCKET, message.workspaceId, message.objectKey);
}

export async function enqueueCleanup(env: NotificationEnv, message: { workspaceId: string; objectKey: string }) {
  const payload = { kind: "cleanup" as const, ...message };
  if (env.CLEANUP_QUEUE && shouldUseNotificationQueue(env)) {
    await env.CLEANUP_QUEUE.send(payload);
    return;
  }
  await handleCleanupMessage(message, env);
}
