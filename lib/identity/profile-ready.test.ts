import { test } from "node:test";
import assert from "node:assert/strict";
import { identitySlotsFilled, isReferenceProfileReady, type IdentityBundle } from "./queries";

function bundle(partial: Partial<IdentityBundle>): IdentityBundle {
  return {
    identityId: "id_1",
    status: "complete",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    consented: true,
    assets: {},
    ...partial,
  };
}

test("reference profile needs consent, selfie video, and three face photos", () => {
  assert.equal(isReferenceProfileReady(null), false);
  assert.equal(isReferenceProfileReady(bundle({ consented: false })), false);
  assert.equal(isReferenceProfileReady(bundle({ assets: {} })), false);
  assert.equal(
    isReferenceProfileReady(
      bundle({
        assets: {
          IDENTITY_VIDEO: { role: "IDENTITY_VIDEO", assetId: "a", mimeType: "video/mp4", durationSeconds: 10 },
          IDENTITY_FRONT: { role: "IDENTITY_FRONT", assetId: "b", mimeType: "image/jpeg", durationSeconds: null },
          IDENTITY_LEFT: { role: "IDENTITY_LEFT", assetId: "c", mimeType: "image/jpeg", durationSeconds: null },
          IDENTITY_RIGHT: { role: "IDENTITY_RIGHT", assetId: "d", mimeType: "image/jpeg", durationSeconds: null },
        },
      }),
    ),
    true,
  );
  assert.equal(identitySlotsFilled({}), false);
  assert.equal(
    identitySlotsFilled({
      IDENTITY_VIDEO: { assetId: "a" },
      IDENTITY_FRONT: { assetId: "b" },
      IDENTITY_LEFT: { assetId: "c" },
      IDENTITY_RIGHT: { assetId: "d" },
    }),
    true,
  );
});
