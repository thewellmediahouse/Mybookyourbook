export type EmailTemplateId =
  | "welcome"
  | "verify-email"
  | "existing-account"
  | "reset-password"
  | "commercial-ready"
  | "commercial-failed"
  | "payment-receipt"
  | "team-invite"
  | "support-staff"
  | "support-received"
  | "support-reply";

export type EmailQueueMessage = {
  kind: "email";
  template: EmailTemplateId;
  to: string;
  idempotencyKey: string;
  appUrl: string;
  actionUrl?: string;
  firstName?: string;
  title?: string;
  body?: string;
  buttonLabel?: string;
};

export type CleanupQueueMessage = {
  kind: "cleanup";
  workspaceId: string;
  objectKey: string;
};

export type NotificationQueueMessage = EmailQueueMessage | CleanupQueueMessage;

export function isEmailQueueMessage(value: unknown): value is EmailQueueMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as { kind?: unknown; template?: unknown; to?: unknown; idempotencyKey?: unknown };
  return row.kind === "email" && typeof row.template === "string" && typeof row.to === "string";
}

export function isCleanupQueueMessage(value: unknown): value is CleanupQueueMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as { kind?: unknown; workspaceId?: unknown; objectKey?: unknown };
  return row.kind === "cleanup" && typeof row.workspaceId === "string" && typeof row.objectKey === "string";
}
