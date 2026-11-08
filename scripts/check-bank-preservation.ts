import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { createPrismaClient } from "../lib/prisma-factory";
import { mathematicsQuestions } from "../prisma/seed-data/mathematics";
import { physicsQuestions } from "../prisma/seed-data/physics";
import { chemistryQuestions } from "../prisma/seed-data/chemistry";
import { biologyQuestions } from "../prisma/seed-data/biology";
import { supplementalPatternQuestions } from "../prisma/seed-data/supplemental-patterns";
import { advancedFinalQuestions } from "../prisma/seed-data/advanced-final-questions";
import { validateQuestions } from "../prisma/seed-data/question-factory";
import { seedDatabase } from "../prisma/seed";
import { importCatalog } from "../lib/questions/catalog-import";

const baseline = "b8df959c6da9a42479da5a092900fe7a3e11358d";
// Byte-for-byte frozen: the question catalog source, the gallery and the browser icon.
// The round pages were rebuilt in V3 (answers hidden, server timing), so their branding is checked by content below.
const preservedPaths = ["prisma/seed-data", "app/icon.tsx", "app/gallery", "lib/gallery-data.ts"];
function git(args: string[]) {
  const result = spawnSync("git", args, { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
git(["diff", "--exit-code", baseline, "--", ...preservedPaths]);
const assetLines = git(["ls-tree", "-r", baseline, "--", "public"]).trim().split("\n");
for (const line of assetLines) {
  const [metadata, originalPath] = line.split("\t");
  const path = originalPath === "public/gallery/NSMQ-trophy.jpg" ? "public/gallery/nsmq-trophy.jpg" : originalPath;
  assert.equal(git(["hash-object", path]).trim(), metadata.split(" ")[2], "Original image content changed: " + path);
}
const assetPaths = git(["ls-files", "--", "public"]).trim().split("\n");
assert.equal(new Set(assetPaths.map((path) => path.toLowerCase())).size, assetPaths.length, "Case-colliding public assets cannot be served consistently on Windows.");
const read = (path: string) => readFileSync(path, "utf8");
const branding: [string, RegExp][] = [
  ["app/page.tsx", /\/brand\/ghanata-shs-logo\.jpg/], ["app/page.tsx", /Ghanata SHS/], ["app/page.tsx", /Carpe Diem/],
  ["app/page.tsx", /GalleryCarousel/], ["app/page.tsx", /TrophySpotlight/], ["app/page.tsx", /ghanata-journey\.png/],
  ["components/site-header.tsx", /\/brand\/nsmq-logo\.png/], ["components/site-header.tsx", /NSMQ Training Hub/],
  ["components/auth-form.tsx", /Ghanata SHS Quiz Team/],
];
for (const [path, pattern] of branding) assert.match(read(path), pattern, "Branding missing from " + path);
for (const page of ["app/practice/page.tsx", "app/contest/page.tsx", "app/speed-race/page.tsx", "app/problem-of-the-day/page.tsx", "app/true-false/page.tsx", "app/riddles/page.tsx", "app/question-bank/page.tsx"]) {
  assert.ok(read(page).length > 0, page + " missing");
}
for (const alias of ["app/full-contest/page.tsx", "app/potd/page.tsx", "app/tf/page.tsx"]) assert.match(read(alias), /export \{ default \}/, alias);
console.log("PASS Ghanata branding, gallery images and mappings, all five round pages and catalog source preserved");

mkdirSync("work", { recursive: true });
const folder = mkdtempSync(resolve("work", "preservation-test-"));
const legacyPath = resolve(folder, "legacy.db");
const upgradedPath = resolve(folder, "upgraded.db");
const schemaPath = resolve(folder, "legacy.prisma");
writeFileSync(schemaPath, git(["show", baseline + ":prisma/schema.prisma"]));
const databaseUrl = "file:" + upgradedPath.replaceAll("\\", "/");
const env = { ...process.env, DATABASE_URL: databaseUrl, IMPORT_LEGACY_QUESTION_FACTORY: "false" };
function prisma(args: string[]) {
  const result = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), ...args], {
    env, encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}
const sql = prisma(["migrate", "diff", "--from-empty", "--to-schema-datamodel", schemaPath, "--script"]);
const questions = [
  ...mathematicsQuestions, ...physicsQuestions, ...chemistryQuestions,
  ...biologyQuestions, ...supplementalPatternQuestions, ...advancedFinalQuestions,
];
validateQuestions(questions);
assert.equal(questions.length, 4226);
assert.equal(questions.filter((question) => question.isGhanaContext).length, 1001);
assert.equal(questions.filter((question) => question.isGhanaContext && question.roundType === "RIDDLE").length, 161);

const tables = ["User", "Question", "RiddleClue", "Attempt", "ContestSession", "Topic"];
const quoted = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const original = new DatabaseSync(legacyPath);
original.exec(sql);
const columns = Object.fromEntries(tables.map((table) => [table,
  original.prepare("PRAGMA table_info(" + quoted(table) + ")").all().map((column) => String(column.name)),
]));
function insert(table: string, record: Record<string, unknown>) {
  const fields = columns[table].filter((field) => record[field] !== undefined);
  const values = fields.map((field): SQLInputValue => {
    const value = record[field];
    if (value === null) return null;
    if (typeof value === "boolean") return Number(value);
    if (typeof value === "string" || typeof value === "number") return value;
    throw new Error("Unsupported fixture value: " + field);
  });
  original.prepare("INSERT INTO " + quoted(table) + " (" + fields.map(quoted).join(",") + ") VALUES (" + fields.map(() => "?").join(",") + ")").run(...values);
}
function snapshot(database: DatabaseSync) {
  return Object.fromEntries(tables.map((table) => {
    const rows = database.prepare("SELECT " + columns[table].map(quoted).join(",") + " FROM " + quoted(table) + " ORDER BY id").all();
    return [table, { count: rows.length, hash: createHash("sha256").update(JSON.stringify(rows)).digest("hex") }];
  }));
}
// Reconstruct only the unchanged legacy catalog in an owned disposable test DB.
const time = Date.UTC(2026, 0, 1);
original.exec("BEGIN");
insert("User", { id: "fixture-student", name: "Fixture Student", email: "fixture-student@example.test", role: "STUDENT", createdAt: time });
insert("User", { id: "fixture-coach", name: "Fixture Coach", email: "fixture-coach@example.test", role: "COACH", createdAt: time });
for (const [index, question] of questions.entries()) {
  const id = "fixture-question-" + String(index).padStart(5, "0");
  insert("Question", {
    ...question, id, acceptedAnswers: JSON.stringify(question.acceptedAnswers), tags: JSON.stringify(question.tags),
    sourceName: "NSMQ Training Hub original question factory", createdAt: time, updatedAt: time,
  });
  for (const clue of question.riddleClues ?? []) insert("RiddleClue", { ...clue, questionId: id, id: id + "-clue-" + clue.clueNumber });
}
const topics = [...new Map(questions.map((question) => [question.subject + ":" + question.topic, question])).values()];
for (const [index, question] of topics.entries()) insert("Topic", { id: "fixture-topic-" + index, subject: question.subject, name: question.topic, description: "Synthetic CI topic metadata" });
insert("Attempt", { id: "fixture-attempt", userId: "fixture-student", questionId: "fixture-question-00000", userAnswer: questions[0].answer, isCorrect: true, timeTakenSeconds: 12, pointsAwarded: 3, mode: questions[0].roundType, createdAt: time });
insert("ContestSession", { id: "fixture-contest", title: "Synthetic CI contest", mode: "FULL_CONTEST", teamAScore: 9, teamBScore: 12, teamCScore: 15, currentRound: 2, createdAt: time });
original.exec("COMMIT");
const before = snapshot(original);
assert.equal(before.Question.count, 4226);
assert.equal(before.RiddleClue.count, 2720);
original.close();
copyFileSync(legacyPath, upgradedPath);
prisma(["db", "push", "--skip-generate"]);

async function main() {
  const db = createPrismaClient(databaseUrl);
  const previousFactoryOptIn = process.env.IMPORT_LEGACY_QUESTION_FACTORY;
  process.env.IMPORT_LEGACY_QUESTION_FACTORY = "false";
  try {
    await seedDatabase(db);
    await seedDatabase(db);
    // The hosted-build import recognises every existing legacy row (including repeated items) and adds nothing.
    const catalog = await importCatalog(db, questions, { reviewStatus: "LEGACY_UNREVIEWED", sourceName: "check" });
    assert.deepEqual(catalog, { inserted: 0, skipped: 4226 });
    assert.equal(await db.question.count(), 4226);
    assert.equal(await db.question.count({ where: { isGhanaContext: true } }), 1001);
    assert.equal(await db.question.count({ where: { isGhanaContext: true, roundType: "RIDDLE" } }), 161);
    assert.equal(await db.question.count({ where: { revision: 1 } }), 4226);
    assert.equal((await db.attempt.findUniqueOrThrow({ where: { id: "fixture-attempt" } })).userId, "fixture-student");
    const upgraded = new DatabaseSync(upgradedPath, { readOnly: true });
    try { assert.deepEqual(snapshot(upgraded), before); } finally { upgraded.close(); }
    console.log("PASS additive schema + repeated seed preserve every legacy field/ID for 4,226 questions, 2,720 clues, users, attempts, topics and contest records");
    writeFileSync(resolve("work", "ci-bank-path.txt"), upgradedPath);
    if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, "NSMQ_TEST_DATABASE_PATH=" + upgradedPath + "\n");
    console.log("Disposable bank fixture: " + upgradedPath);
  } finally {
    if (previousFactoryOptIn === undefined) delete process.env.IMPORT_LEGACY_QUESTION_FACTORY;
    else process.env.IMPORT_LEGACY_QUESTION_FACTORY = previousFactoryOptIn;
    await db.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
