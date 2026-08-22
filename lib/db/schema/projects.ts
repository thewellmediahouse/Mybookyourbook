import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createdAt, timestampMs, updatedAt } from "./_columns";
import { assets } from "./assets";
import { user } from "./auth";
import { businesses } from "./businesses";
import { workspaces } from "./workspaces";

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    objective: text("objective"),
    targetCustomer: text("target_customer"),
    problem: text("problem"),
    valueProposition: text("value_proposition"),
    offer: text("offer"),
    ctaType: text("cta_type"),
    ctaValue: text("cta_value"),
    style: text("style"),
    toneJson: text("tone_json"),
    platform: text("platform"),
    aspectRatio: text("aspect_ratio"),
    duration: integer("duration").notNull().default(30),
    status: text("status").notNull().default("DRAFT"),
    currentCreativeVersionId: text("current_creative_version_id"),
    createdAt,
    updatedAt,
    deletedAt: timestampMs("deleted_at"),
  },
  (table) => [
    index("projects_workspace_idx").on(table.workspaceId),
    index("projects_business_idx").on(table.businessId),
    index("projects_status_idx").on(table.status),
  ],
);

export const projectReferences = sqliteTable(
  "project_references",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id),
    mappingSlot: text("mapping_slot").notNull(),
    createdAt,
  },
  (table) => [index("project_references_project_idx").on(table.projectId)],
);

export const creativeVersions = sqliteTable(
  "creative_versions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    hook: text("hook"),
    strategy: text("strategy"),
    spokenScript: text("spoken_script"),
    draftScript: text("draft_script"),
    approvedScript: text("approved_script"),
    scriptVersion: integer("script_version"),
    scenesJson: text("scenes_json"),
    callToAction: text("call_to_action"),
    seedancePrompt: text("seedance_prompt"),
    approvedAt: timestampMs("approved_at"),
    approvedBy: text("approved_by").references(() => user.id),
    createdAt,
  },
  (table) => [
    unique("creative_versions_project_version_uid").on(table.projectId, table.version),
    index("creative_versions_project_idx").on(table.projectId),
  ],
);

export const productionJobs = sqliteTable(
  "production_jobs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    creativeVersionId: text("creative_version_id")
      .notNull()
      .references(() => creativeVersions.id),
    workflowInstanceId: text("workflow_instance_id"),
    status: text("status").notNull(),
    videoProvider: text("video_provider"),
    videoProviderJobId: text("video_provider_job_id"),
    upscaleProvider: text("upscale_provider"),
    upscaleProviderJobId: text("upscale_provider_job_id"),
    sourceAssetId: text("source_asset_id").references(() => assets.id),
    enhancedAssetId: text("enhanced_asset_id").references(() => assets.id),
    finalAssetId: text("final_asset_id").references(() => assets.id),
    creditTransactionId: text("credit_transaction_id"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    estimatedProviderCostUsd: integer("estimated_provider_cost_usd"),
    actualProviderCostUsd: integer("actual_provider_cost_usd"),
    failureType: text("failure_type"),
    failureCode: text("failure_code"),
    internalFailureMessage: text("internal_failure_message"),
    customerFailureMessage: text("customer_failure_message"),
    startedAt: timestampMs("started_at"),
    completedAt: timestampMs("completed_at"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("production_jobs_workspace_idx").on(table.workspaceId),
    index("production_jobs_project_idx").on(table.projectId),
    index("production_jobs_status_idx").on(table.status),
  ],
);

export const productionEvents = sqliteTable(
  "production_events",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => productionJobs.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payloadJson: text("payload_json"),
    createdAt,
  },
  (table) => [index("production_events_job_idx").on(table.jobId)],
);

export const generationAttempts = sqliteTable(
  "generation_attempts",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    jobId: text("job_id")
      .notNull()
      .references(() => productionJobs.id),
    attemptNumber: integer("attempt_number").notNull(),
    provider: text("provider").notNull(),
    providerRequestId: text("provider_request_id"),
    creativeVersionId: text("creative_version_id")
      .notNull()
      .references(() => creativeVersions.id),
    creditTransactionId: text("credit_transaction_id"),
    reason: text("reason"),
    result: text("result"),
    createdAt,
  },
  (table) => [index("generation_attempts_job_idx").on(table.jobId)],
);
