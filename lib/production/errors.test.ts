import { test } from "node:test";
import assert from "node:assert/strict";
import { isRetryableInfrastructureError } from "./errors";

test("deploy and isolate resets are not customer failures", () => {
  assert.equal(
    isRetryableInfrastructureError(new Error("Durable Object reset because its code was updated.")),
    true,
  );
  assert.equal(isRetryableInfrastructureError(new Error("Worker exceeded resource limits")), true);
  assert.equal(isRetryableInfrastructureError(new Error("SEEDANCE_FAILED")), false);
  assert.equal(isRetryableInfrastructureError(new Error("We couldn't enhance your footage right now.")), false);
});
