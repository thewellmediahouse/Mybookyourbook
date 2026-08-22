export type AuthzCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "SUSPENDED";

export class AuthzError extends Error {
  readonly code: AuthzCode;

  constructor(code: AuthzCode, message: string) {
    super(message);
    this.name = "AuthzError";
    this.code = code;
  }
}

export function isAuthzError(error: unknown): error is AuthzError {
  return error instanceof AuthzError;
}
