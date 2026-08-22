import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, timestampMs, unixMsNow, updatedAt } from "./_columns";

/**
 * Better Auth core tables (SQLite).
 * Column names follow Better Auth Drizzle sqlite examples
 * (https://www.better-auth.com/docs/adapters/drizzle, 2026-08-20).
 * Do not rename tables: adapter expects `user`, `session`, `account`, `verification`.
 */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestampMs("created_at").default(unixMsNow).notNull(),
  updatedAt: timestampMs("updated_at")
    .default(unixMsNow)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestampMs("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestampMs("created_at").default(unixMsNow).notNull(),
    updatedAt: timestampMs("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestampMs("access_token_expires_at"),
    refreshTokenExpiresAt: timestampMs("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestampMs("created_at").default(unixMsNow).notNull(),
    updatedAt: timestampMs("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_userId_idx").on(table.userId),
    uniqueIndex("account_issuer_accountId_uidx").on(table.issuer, table.accountId),
  ],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestampMs("expires_at").notNull(),
    createdAt: timestampMs("created_at").default(unixMsNow),
    updatedAt: timestampMs("updated_at")
      .default(unixMsNow)
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** App profile fields Better Auth does not own (first/last name, locale). */
export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  timezone: text("timezone"),
  country: text("country"),
  emailProductUpdates: integer("email_product_updates", { mode: "boolean" }).notNull().default(false),
  deletedAt: timestampMs("deleted_at"),
  createdAt,
  updatedAt,
});
