export class RateLimitError extends Error {
  readonly code = "RATE_LIMIT" as const;

  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
