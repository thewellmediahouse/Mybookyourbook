import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { HOME_MEDIA_PATHS, HOME_STATS } from "./home";

test("homepage pack exposes all 46 implementation assets", () => {
  assert.equal(HOME_MEDIA_PATHS.length, 46);
  const root = join(process.cwd(), "public");
  for (const path of HOME_MEDIA_PATHS) {
    assert.equal(existsSync(join(root, path.replace(/^\//, ""))), true, path);
  }
});

test("homepage statistics are sourced industry figures, not Production30 results", () => {
  assert.match(HOME_STATS.sourceLabel, /not Production30 customer results/);
  assert.equal(HOME_STATS.sourceHref, "https://wyzowl.com/video-marketing-statistics/");
  assert.deepEqual(
    HOME_STATS.items.map((item) => item.value),
    ["83%", "85%", "82%"],
  );
});
