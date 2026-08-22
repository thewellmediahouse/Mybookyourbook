import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { account, profiles, session, user, verification } from "@/lib/db/schema";
import { getEmailProvider, type EmailProvider } from "@/lib/providers/email";
import { getAuthBaseUrl, getAuthSecret, isGoogleAuthConfigured } from "./env";
import { isStrongPassword, MIN_PASSWORD_LENGTH, normalizeEmail, passwordHint } from "./password";
import { renderEmail } from "@/lib/notifications/templates";
import { resetPasswordEventKey, verifyEmailEventKey, welcomeEventKey } from "@/lib/notifications/copy";
import type { EmailQueueMessage } from "@/lib/notifications/messages";
import { ACCOUNT_CLOSED_LOGIN } from "@/lib/security/copy";
import { RateLimitError } from "@/lib/security/errors";
import { assertRateLimit, assertWorkersRateLimit, type WorkersRateLimit } from "@/lib/security/rate-limit";

export type AuthRuntimeEnv = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  AUTH_RATE_LIMIT?: WorkersRateLimit;
};

function nameParts(name: string, firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim() || name.trim().split(/\s+/)[0] || "Friend";
  const last = lastName?.trim() || name.trim().split(/\s+/).slice(1).join(" ") || first;
  return { firstName: first, lastName: last };
}

export type CreateAuthOptions = {
  waitUntil?: (promise: Promise<unknown>) => void;
  email?: EmailProvider;
};

function originFromUrl(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function sendTemplated(email: EmailProvider, message: EmailQueueMessage) {
  const rendered = renderEmail(message);
  return email.send({
    to: message.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: message.idempotencyKey,
  });
}

export function createAuth(db: Db, env: AuthRuntimeEnv, options: CreateAuthOptions = {}) {
  const email = options.email ?? getEmailProvider(env);
  const dispatch = (task: Promise<unknown>) => {
    if (options.waitUntil) {
      options.waitUntil(task);
      return;
    }
    void task;
  };
  const baseURL = getAuthBaseUrl(env);

  return betterAuth({
    secret: getAuthSecret(env),
    baseURL,
    trustedOrigins: [originFromUrl(baseURL)],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user,
        session,
        account,
        verification,
      },
      transaction: false,
    }),
    user: {
      additionalFields: {
        firstName: { type: "string", required: false, input: true },
        lastName: { type: "string", required: false, input: true },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const task = sendTemplated(email, {
          kind: "email",
          template: "reset-password",
          to: user.email,
          idempotencyKey: resetPasswordEventKey(url),
          appUrl: baseURL,
          actionUrl: url,
        });
        dispatch(task);
        await task;
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const task = sendTemplated(email, {
          kind: "email",
          template: "verify-email",
          to: user.email,
          idempotencyKey: verifyEmailEventKey(url),
          appUrl: baseURL,
          actionUrl: url,
        });
        dispatch(task);
        await task;
      },
    },
    socialProviders: isGoogleAuthConfigured(env)
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const parts = nameParts(
              user.name,
              "firstName" in user ? (user.firstName as string | undefined) : undefined,
              "lastName" in user ? (user.lastName as string | undefined) : undefined,
            );
            const existing = await db
              .select({ userId: profiles.userId })
              .from(profiles)
              .where(eq(profiles.userId, user.id))
              .limit(1);
            if (existing.length > 0) {
              return;
            }
            await db.insert(profiles).values({
              userId: user.id,
              firstName: parts.firstName,
              lastName: parts.lastName,
            });
            const welcome = sendTemplated(email, {
              kind: "email",
              template: "welcome",
              to: user.email,
              firstName: parts.firstName,
              idempotencyKey: welcomeEventKey(user.id),
              appUrl: baseURL,
              actionUrl: "/dashboard",
            }).catch(() => undefined);
            dispatch(welcome);
            await welcome;
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const body = ctx.body as Record<string, unknown> | undefined;
        if (!body) {
          return;
        }
        if (typeof body.email === "string") {
          body.email = normalizeEmail(body.email);
        }
        const email = typeof body.email === "string" ? body.email : "";
        try {
          if (ctx.path === "/sign-up/email" && email) {
            await assertWorkersRateLimit(env.AUTH_RATE_LIMIT, `signup:${email}`);
            await assertRateLimit(db, "signup", email);
          }
          if (ctx.path === "/sign-in/email" && email) {
            await assertWorkersRateLimit(env.AUTH_RATE_LIMIT, `login:${email}`);
            await assertRateLimit(db, "login", email);
            const [closed] = await db
              .select({ deletedAt: profiles.deletedAt })
              .from(profiles)
              .innerJoin(user, eq(user.id, profiles.userId))
              .where(eq(user.email, email))
              .limit(1);
            if (closed?.deletedAt) {
              throw new APIError("FORBIDDEN", { message: ACCOUNT_CLOSED_LOGIN });
            }
          }
          if (ctx.path === "/request-password-reset" && email) {
            await assertWorkersRateLimit(env.AUTH_RATE_LIMIT, `reset:${email}`);
            await assertRateLimit(db, "reset", email);
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            throw new APIError("TOO_MANY_REQUESTS", { message: error.message });
          }
          throw error;
        }
        const password = String(body.password ?? body.newPassword ?? "");
        const checksPassword =
          ctx.path === "/sign-up/email" ||
          ctx.path === "/reset-password" ||
          ctx.path === "/change-password";
        if (checksPassword && password && !isStrongPassword(password)) {
          throw new APIError("BAD_REQUEST", { message: passwordHint() });
        }
      }),
    },
    plugins: [nextCookies()],
  });
}
