import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { EXAMPLE_CLIPS, HERO_CLIP } from "./example-videos";

test("example clips have a still poster so the card is not waiting on the video file", () => {
  const root = join(process.cwd(), "public");
  for (const clip of [...EXAMPLE_CLIPS, HERO_CLIP]) {
    assert.equal(existsSync(join(root, clip.src.replace(/^\//, ""))), true, clip.src);
    assert.equal(existsSync(join(root, clip.poster.replace(/^\//, ""))), true, clip.poster);
    assert.match(clip.poster, /\/examples\/posters\/.+\.jpg$/);
  }
});
