import assert from "node:assert/strict";
import { closeSync, mkdirSync, mkdtempSync, openSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createPrismaClient } from "../lib/prisma-factory";

// Simulates the first Vercel deploy: an empty database, tables created, then the build's two import steps, twice.
mkdirSync("work", { recursive: true });
const folder = mkdtempSync(resolve("work", "hosted-import-"));
closeSync(openSync(resolve(folder, "fresh.db"), "w"));
const url = "file:" + resolve(folder, "fresh.db").replaceAll("\\", "/");
const env = { ...process.env, DATABASE_URL: url };
const run = (args: string[]) => {
  const result = spawnSync(process.execPath, args, { env, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
};
run([resolve("node_modules/prisma/build/index.js"), "db", "push", "--skip-generate"]);
const tsx = resolve("node_modules/tsx/dist/cli.mjs");
for (let round = 1; round <= 2; round += 1) {
  run([tsx, "scripts/ensure-database.ts"]);
  console.log(run([tsx, "scripts/import-catalog.ts"]).trim());
  console.log(run([tsx, "scripts/import-elements.ts"]).trim());
}
const db = createPrismaClient(url);
async function main() {
  assert.equal(await db.question.count({ where: { reviewStatus: "LEGACY_UNREVIEWED" } }), 4226);
  assert.equal(await db.question.count({ where: { reviewStatus: "AUTO_VERIFIED", topic: "Periodic Chemistry" } }), 1387);
  assert.equal(await db.riddleClue.count({ where: { question: { reviewStatus: "LEGACY_UNREVIEWED" } } }), 2720);
  assert.equal(await db.question.count({ where: { isGhanaContext: true } }), 1001);
  assert.equal(await db.role.count(), 4);
  console.log("PASS a fresh hosted database receives all 4,226 legacy questions, 2,720 clues and 1,387 element drills exactly once");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
