import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const originalPath = process.env.ORIGINAL_SQLITE_PATH;
if (!originalPath) throw new Error("Set ORIGINAL_SQLITE_PATH to the unchanged V2 database snapshot.");
const original = new DatabaseSync(resolve(originalPath), { readOnly: true });
const upgraded = new DatabaseSync(resolve("prisma/dev.db"), { readOnly: true });
try {
  for (const table of ["User", "Question", "RiddleClue", "Attempt", "ContestSession", "Topic"]) {
    const columns = original.prepare('PRAGMA table_info("' + table + '")').all()
      .map((column) => String(column.name));
    const selection = columns.map((column) => '"' + column.replaceAll('"', '""') + '"').join(",");
    const query = "SELECT " + selection + ' FROM "' + table + '" ORDER BY id';
    const before = original.prepare(query).all();
    const after = upgraded.prepare(query).all();
    const digest = (rows: unknown) => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
    assert.equal(after.length, before.length, table + " row count changed.");
    assert.equal(digest(after), digest(before), table + " legacy values changed.");
    console.log(table + ": " + before.length + " rows preserved; legacy-field hash matches.");
  }
} finally { original.close(); upgraded.close(); }
