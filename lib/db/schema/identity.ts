import { index, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createdAt, updatedAt } from "./_columns";
import { assets } from "./assets";
import { user } from "./auth";
import { workspaces } from "./workspaces";

export const presenterIdentities = sqliteTable(
  "presenter_identities",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("incomplete"),
    createdAt,
    updatedAt,
  },
  (table) => [
    unique("presenter_identities_workspace_user_uid").on(table.workspaceId, table.userId),
    index("presenter_identities_user_idx").on(table.userId),
  ],
);

export const identityAssets = sqliteTable(
  "identity_assets",
  {
    id: text("id").primaryKey(),
    identityId: text("identity_id")
      .notNull()
      .references(() => presenterIdentities.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["IDENTITY_FRONT", "IDENTITY_LEFT", "IDENTITY_RIGHT", "IDENTITY_VIDEO"],
    }).notNull(),
    createdAt,
  },
  (table) => [
    unique("identity_assets_identity_role_uid").on(table.identityId, table.role),
    index("identity_assets_identity_idx").on(table.identityId),
  ],
);
