import { index, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createdAt, timestampMs, updatedAt } from "./_columns";
import { user } from "./auth";

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type", { enum: ["BUSINESS", "AGENCY"] }).notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id),
    country: text("country").notNull(),
    billingCurrency: text("billing_currency").notNull(),
    planCode: text("plan_code"),
    status: text("status").notNull().default("active"),
    createdAt,
    updatedAt,
  },
  (table) => [index("workspaces_owner_idx").on(table.ownerUserId)],
);

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["OWNER", "ADMIN", "CREATOR", "VIEWER"] }).notNull(),
    status: text("status").notNull().default("active"),
    invitedBy: text("invited_by").references(() => user.id),
    joinedAt: timestampMs("joined_at"),
    createdAt,
  },
  (table) => [
    unique("workspace_members_workspace_user_uid").on(table.workspaceId, table.userId),
    index("workspace_members_user_idx").on(table.userId),
  ],
);

export const workspaceInvitations = sqliteTable(
  "workspace_invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", { enum: ["ADMIN", "CREATOR", "VIEWER"] }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id),
    expiresAt: timestampMs("expires_at").notNull(),
    acceptedAt: timestampMs("accepted_at"),
    createdAt,
  },
  (table) => [index("workspace_invitations_workspace_idx").on(table.workspaceId)],
);
