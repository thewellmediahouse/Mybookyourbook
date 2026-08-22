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
