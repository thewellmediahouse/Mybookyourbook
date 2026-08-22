import assert from "node:assert/strict";
import { getTableName } from "drizzle-orm";
import { REQUIRED_TABLES } from "../lib/db/required-tables";
import * as schema from "../lib/db/schema";

const exportedNames = new Set(
  Object.values(schema).map((table) => getTableName(table as Parameters<typeof getTableName>[0])),
);

for (const name of REQUIRED_TABLES) {
  assert.equal(exportedNames.has(name), true, `missing Drizzle table: ${name}`);
}

assert.equal(exportedNames.size, REQUIRED_TABLES.length, "unexpected extra or missing tables");

console.log(`schema ok: ${REQUIRED_TABLES.length} tables`);
