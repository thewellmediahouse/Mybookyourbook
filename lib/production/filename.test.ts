import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assetStreamHeaders,
  commercialDownloadFilename,
  contentDisposition,
  finalCommercialFilename,
} from "./filename";

test("download filename is production30-business-campaign and strips unsafe characters", () => {
  assert.equal(
    commercialDownloadFilename("Harbour Tours", "Summer Harbour"),
    "production30-harbour-tours-summer-harbour.mp4",
  );
  assert.equal(
    commercialDownloadFilename("A / B * Co?", "../secret"),
    "production30-a-b-co-secret.mp4",
  );
  assert.equal(commercialDownloadFilename("   ", ""), "production30-studio-commercial.mp4");
});

test("download uses attachment Content-Disposition with the production30 filename", () => {
  const filename = commercialDownloadFilename("Harbour Tours", "Summer Harbour");
  assert.equal(
    contentDisposition("attachment", filename),
    'attachment; filename="production30-harbour-tours-summer-harbour.mp4"',
  );
  assert.equal(
    finalCommercialFilename({
      category: "final",
      role: "master",
      businessName: "Harbour Tours",
      campaignTitle: "Summer Harbour",
      mimeType: "video/mp4",
    }),
    filename,
  );
  const headers = assetStreamHeaders({
    mimeType: "video/mp4",
    sizeBytes: 2048,
    download: true,
    filename,
  });
  assert.equal(headers["Content-Disposition"], `attachment; filename="${filename}"`);
  assert.equal(headers["Content-Length"], "2048");
  assert.equal(headers["Cache-Control"], "private, max-age=60");
  const inline = assetStreamHeaders({
    mimeType: "video/mp4",
    sizeBytes: 2048,
    download: false,
    filename,
  });
  assert.equal(inline["Content-Disposition"], "inline");
});
