import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, updatedAt } from "./_columns";
import { workspaces } from "./workspaces";

export const businesses = sqliteTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website"),
    industry: text("industry"),
    country: text("country"),
    city: text("city"),
    description: text("description"),
    services: text("services"),
    targetCustomer: text("target_customer"),
    tagline: text("tagline"),
    phone: text("phone"),
    email: text("email"),
    whatsapp: text("whatsapp"),
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
    defaultCta: text("default_cta"),
    defaultLogoPosition: text("default_logo_position").default("bottom-right"),
    timezone: text("timezone"),
    createdAt,
    updatedAt,
  },
  (table) => [index("businesses_workspace_idx").on(table.workspaceId)],
);
