/** Worker/Workflow was restarted mid-job (deploy). Do not email a failure. */
export function isRetryableInfrastructureError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /durable object reset/i.test(message) ||
    /code was updated/i.test(message) ||
    /worker exceeded resource limits/i.test(message) ||
    /exceeded cpu/i.test(message)
  );
}

export class ProductionError extends Error {
  readonly code:
    | "NO_CREDITS"
    | "NOT_READY"
    | "IDENTITY"
    | "CONSENT"
    | "DUPLICATE"
    | "FAILED"
    | "NOT_FOUND";

  constructor(code: ProductionError["code"], message: string) {
    super(message);
    this.name = "ProductionError";
    this.code = code;
  }
}
