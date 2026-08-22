import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createdAt, timestampMs, updatedAt } from "./_columns";
import { workspaces } from "./workspaces";

export const plans = sqliteTable(
  "plans",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor"),
    credits: integer("credits"),
    interval: text("interval", { enum: ["one_time", "month"] }).notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    metadataJson: text("metadata_json"),
  },
  (table) => [unique("plans_code_region_uid").on(table.code, table.region)],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    provider: text("provider").notNull(),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    status: text("status").notNull(),
    periodStart: timestampMs("period_start"),
    periodEnd: timestampMs("period_end"),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    createdAt,
    updatedAt,
  },
  (table) => [index("subscriptions_workspace_idx").on(table.workspaceId)],
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    provider: text("provider").notNull(),
    providerReference: text("provider_reference").notNull(),
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    status: text("status").notNull(),
    metadataJson: text("metadata_json"),
    createdAt,
    updatedAt,
  },
  (table) => [
    unique("payments_provider_reference_uid").on(table.provider, table.providerReference),
    index("payments_workspace_idx").on(table.workspaceId),
  ],
);

export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    paymentId: text("payment_id").references(() => payments.id),
    type: text("type").notNull(),
    payloadJson: text("payload_json"),
    processedAt: timestampMs("processed_at"),
    createdAt,
  },
  (table) => [unique("payment_events_provider_event_uid").on(table.provider, table.providerEventId)],
);
