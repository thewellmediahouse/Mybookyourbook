export class CreditError extends Error {
  readonly code: "NO_CREDITS" | "NOT_FOUND";

  constructor(code: "NO_CREDITS" | "NOT_FOUND", message: string) {
    super(message);
    this.name = "CreditError";
    this.code = code;
  }
}

export function isUniqueConflict(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i += 1) {
    const message = current instanceof Error ? `${current.name} ${current.message}` : String(current);
    if (/UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(message)) {
      return true;
    }
    current = current instanceof Error ? current.cause : undefined;
  }
  return false;
}
