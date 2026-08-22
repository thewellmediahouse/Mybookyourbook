import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createdAt, updatedAt } from "./_columns";
import { workspaces } from "./workspaces";

export const creditWallets = sqliteTable("credit_wallets", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  updatedAt,
});

export const creditTransactions = sqliteTable(
  "credit_transactions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: text("type", {
      enum: [
        "PURCHASE",
        "SUBSCRIPTION_GRANT",
        "GENERATION",
        "TECHNICAL_REFUND",
        "PROMOTION",
        "ADMIN_ADJUSTMENT",
        "EXPIRY",
      ],
    }).notNull(),
    projectId: text("project_id"),
    paymentId: text("payment_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    description: text("description"),
    createdAt,
  },
  (table) => [
    unique("credit_transactions_idempotency_uid").on(table.idempotencyKey),
    index("credit_transactions_workspace_idx").on(table.workspaceId),
  ],
);
