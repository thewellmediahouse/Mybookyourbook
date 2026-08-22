import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { creditTransactions, creditWallets } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import {
  GENERATION_DESCRIPTION,
  NO_PRODUCTION_CREDITS,
  TECHNICAL_REFUND_DESCRIPTION,
  generationIdempotencyKey,
  technicalRefundIdempotencyKey,
} from "./copy";
import { CreditError, isUniqueConflict } from "./errors";

export {
  generationIdempotencyKey,
  technicalRefundIdempotencyKey,
} from "./copy";
export type CreditTransactionType =
  | "PURCHASE"
  | "SUBSCRIPTION_GRANT"
  | "GENERATION"
  | "TECHNICAL_REFUND"
  | "PROMOTION"
  | "ADMIN_ADJUSTMENT"
  | "EXPIRY";

export async function getWalletBalance(db: Db, workspaceId: string): Promise<number> {
  const [row] = await db
    .select({ balance: creditWallets.balance })
    .from(creditWallets)
    .where(eq(creditWallets.workspaceId, workspaceId))
    .limit(1);
  return row?.balance ?? 0;
}

export async function getCreditTransactionByKey(db: Db, idempotencyKey: string) {
  const [row] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.idempotencyKey, idempotencyKey))
    .limit(1);
  return row ?? null;
}

async function ensureWallet(db: Db, workspaceId: string, now: Date) {
  const [existing] = await db
    .select({ workspaceId: creditWallets.workspaceId })
    .from(creditWallets)
    .where(eq(creditWallets.workspaceId, workspaceId))
    .limit(1);
  if (existing) {
    return;
  }
  try {
    await db.insert(creditWallets).values({
      workspaceId,
      balance: 0,
      updatedAt: now,
    });
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }
  }
}

async function adjustBalance(db: Db, workspaceId: string, delta: number, now: number) {
  if (delta <= -1) {
    const amount = Math.abs(delta);
    return db.all<{ balance: number }>(sql`
      UPDATE credit_wallets
      SET balance = balance - ${amount}, updated_at = ${now}
      WHERE workspace_id = ${workspaceId} AND balance >= ${amount}
      RETURNING balance
    `);
  }
  if (delta >= 1) {
    return db.all<{ balance: number }>(sql`
      UPDATE credit_wallets
      SET balance = balance + ${delta}, updated_at = ${now}
      WHERE workspace_id = ${workspaceId}
      RETURNING balance
    `);
  }
  throw new Error("Credit amount is not valid.");
}

export async function grantCredits(
  db: Db,
  input: {
    workspaceId: string;
    amount: number;
    type: Exclude<CreditTransactionType, "GENERATION" | "TECHNICAL_REFUND" | "EXPIRY">;
    idempotencyKey: string;
    description?: string;
    paymentId?: string | null;
  },
) {
  if (!Number.isInteger(input.amount) || input.amount < 1) {
    throw new Error("Credit grants must be a whole number of 1 or more.");
  }
  const existing = await getCreditTransactionByKey(db, input.idempotencyKey);
  if (existing) {
    return existing;
  }
  const now = new Date();
  await ensureWallet(db, input.workspaceId, now);
  const id = newId();
  try {
    await db.insert(creditTransactions).values({
      id,
      workspaceId: input.workspaceId,
      amount: input.amount,
      type: input.type,
      projectId: null,
      paymentId: input.paymentId ?? null,
      idempotencyKey: input.idempotencyKey,
      description: input.description ?? null,
      createdAt: now,
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      const winner = await getCreditTransactionByKey(db, input.idempotencyKey);
      if (winner) {
        return winner;
      }
    }
    throw error;
  }
  await adjustBalance(db, input.workspaceId, input.amount, now.getTime());
  const [row] = await db.select().from(creditTransactions).where(eq(creditTransactions.id, id)).limit(1);
  if (!row) {
    throw new Error("We couldn't add those credits.");
  }
  return row;
}

export async function deductCredits(
  db: Db,
  input: {
    workspaceId: string;
    amount: number;
    idempotencyKey: string;
    description?: string;
  },
) {
  if (!Number.isInteger(input.amount) || input.amount < 1) {
    throw new Error("Credit deductions must be a whole number of 1 or more.");
  }
  const existing = await getCreditTransactionByKey(db, input.idempotencyKey);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const updated = await adjustBalance(db, input.workspaceId, -input.amount, now);
  if (updated.length === 0) {
    throw new CreditError("NO_CREDITS", "That studio does not have enough Ad Credits to deduct.");
  }
  const id = newId();
  try {
    await db.insert(creditTransactions).values({
      id,
      workspaceId: input.workspaceId,
      amount: -input.amount,
      type: "ADMIN_ADJUSTMENT",
      projectId: null,
      paymentId: null,
      idempotencyKey: input.idempotencyKey,
      description: input.description ?? "Staff credit deduction",
      createdAt: new Date(now),
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      await adjustBalance(db, input.workspaceId, input.amount, Date.now());
      const winner = await getCreditTransactionByKey(db, input.idempotencyKey);
      if (winner) {
        return winner;
      }
    }
    throw error;
  }
  const [row] = await db.select().from(creditTransactions).where(eq(creditTransactions.id, id)).limit(1);
  if (!row) {
    throw new Error("We couldn't deduct those credits.");
  }
  return row;
}

export async function reserveGenerationCredit(
  db: Db,
  input: { workspaceId: string; projectId: string; attemptId: string },
) {
  const idempotencyKey = generationIdempotencyKey(input.projectId, input.attemptId);
  const existing = await getCreditTransactionByKey(db, idempotencyKey);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const updated = await adjustBalance(db, input.workspaceId, -1, now);
  if (updated.length === 0) {
    throw new CreditError("NO_CREDITS", NO_PRODUCTION_CREDITS);
  }
  const id = newId();
  try {
    await db.insert(creditTransactions).values({
      id,
      workspaceId: input.workspaceId,
      amount: -1,
      type: "GENERATION",
      projectId: input.projectId,
      paymentId: null,
      idempotencyKey,
      description: GENERATION_DESCRIPTION,
      createdAt: new Date(now),
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      await adjustBalance(db, input.workspaceId, 1, Date.now());
      const winner = await getCreditTransactionByKey(db, idempotencyKey);
      if (winner) {
        return winner;
      }
    }
    throw error;
  }
  const [row] = await db.select().from(creditTransactions).where(eq(creditTransactions.id, id)).limit(1);
  if (!row) {
    throw new Error("We couldn't reserve that Ad Credit.");
  }
  return row;
}

export async function refundTechnicalFailure(
  db: Db,
  input: { workspaceId: string; generationIdempotencyKey: string },
) {
  const original = await getCreditTransactionByKey(db, input.generationIdempotencyKey);
  if (!original || original.type !== "GENERATION" || original.workspaceId !== input.workspaceId) {
    throw new CreditError("NOT_FOUND", "We couldn't return that Ad Credit.");
  }
  const idempotencyKey = technicalRefundIdempotencyKey(input.generationIdempotencyKey);
  const existing = await getCreditTransactionByKey(db, idempotencyKey);
  if (existing) {
    return existing;
  }
  const now = new Date();
  await ensureWallet(db, input.workspaceId, now);
  const id = newId();
  try {
    await db.insert(creditTransactions).values({
      id,
      workspaceId: input.workspaceId,
      amount: 1,
      type: "TECHNICAL_REFUND",
      projectId: original.projectId,
      paymentId: null,
      idempotencyKey,
      description: TECHNICAL_REFUND_DESCRIPTION,
      createdAt: now,
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      const winner = await getCreditTransactionByKey(db, idempotencyKey);
      if (winner) {
        return winner;
      }
    }
    throw error;
  }
  await adjustBalance(db, input.workspaceId, 1, now.getTime());
  const [row] = await db.select().from(creditTransactions).where(eq(creditTransactions.id, id)).limit(1);
  if (!row) {
    throw new Error("We couldn't return that Ad Credit.");
  }
  return row;
}
