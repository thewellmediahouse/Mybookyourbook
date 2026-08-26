import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, timestampMs, updatedAt } from "./_columns";
import { user } from "./auth";
import { presenterIdentities } from "./identity";
import { projects } from "./projects";
import { workspaces } from "./workspaces";

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    eventKey: text("event_key"),
    readAt: timestampMs("read_at"),
    createdAt,
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_workspace_idx").on(table.workspaceId),
    uniqueIndex("notifications_event_key_uid").on(table.eventKey),
  ],
);

export const supportTickets = sqliteTable(
  "support_tickets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id),
    workspaceId: text("workspace_id").references(() => workspaces.id),
    projectId: text("project_id").references(() => projects.id),
    contactEmail: text("contact_email"),
    contactName: text("contact_name"),
    category: text("category").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] })
      .notNull()
      .default("OPEN"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("support_tickets_workspace_idx").on(table.workspaceId),
    index("support_tickets_status_idx").on(table.status),
  ],
);

export const supportReplies = sqliteTable(
  "support_replies",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => user.id),
    authorRole: text("author_role", { enum: ["customer", "staff"] }).notNull(),
    body: text("body").notNull(),
    createdAt,
  },
  (table) => [index("support_replies_ticket_idx").on(table.ticketId)],
);

export const consents = sqliteTable(
  "consents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    identityId: text("identity_id").references(() => presenterIdentities.id),
    consentVersion: text("consent_version").notNull(),
    acceptedAt: timestampMs("accepted_at").notNull(),
    metadata: text("metadata"),
    createdAt,
  },
  (table) => [index("consents_user_idx").on(table.userId)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id),
    workspaceId: text("workspace_id").references(() => workspaces.id),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadataJson: text("metadata_json"),
    createdAt,
  },
  (table) => [
    index("audit_logs_workspace_idx").on(table.workspaceId),
    index("audit_logs_action_idx").on(table.action),
  ],
);

export const rateLimitEvents = sqliteTable(
  "rate_limit_events",
  {
    id: text("id").primaryKey(),
    bucket: text("bucket").notNull(),
    createdAt,
  },
  (table) => [index("rate_limit_events_bucket_idx").on(table.bucket, table.createdAt)],
);

/** Non-secret runtime configuration. Never store API keys here. */
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedAt,
});

export const promptFrameworkVersions = sqliteTable(
  "prompt_framework_versions",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    version: integer("version").notNull(),
    body: text("body").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(false),
    createdAt,
  },
  (table) => [index("prompt_framework_versions_key_idx").on(table.key)],
);
