import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, updatedAt } from "./_columns";
import { businesses } from "./businesses";
import { user } from "./auth";
import { workspaces } from "./workspaces";

/**
 * Media metadata only. Video/image bytes live in private R2 (`r2_object_key`).
 * Never store signed URLs.
 */
export const assets = sqliteTable(
  "assets",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id),
    businessId: text("business_id").references(() => businesses.id, { onDelete: "set null" }),
    projectId: text("project_id"),
    category: text("category").notNull(),
    role: text("role").notNull(),
    r2ObjectKey: text("r2_object_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    fps: integer("fps"),
    videoCodec: text("video_codec"),
    audioCodec: text("audio_codec"),
    status: text("status").notNull().default("ready"),
    createdAt,
    updatedAt,
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("assets_workspace_idx").on(table.workspaceId),
    index("assets_project_idx").on(table.projectId),
    index("assets_r2_key_idx").on(table.r2ObjectKey),
  ],
);

export const brandAssets = sqliteTable(
  "brand_assets",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("logo"),
    createdAt,
  },
  (table) => [index("brand_assets_business_idx").on(table.businessId)],
);
