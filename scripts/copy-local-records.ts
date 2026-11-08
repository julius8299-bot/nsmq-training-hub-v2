// Copies student accounts, attempt history and contest records from your existing local SQLite file
// into the hosted database. Run it once from your own computer:
//
//   POSTGRES_PRISMA_URL="<Neon connection string>" npm run db:copy-local -- prisma/dev.db
//
// It only adds records. Nothing in the source file or the hosted database is edited or deleted, and
// running it twice copies nothing new. Sign-in sessions are not copied; everyone signs in again.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ensureRoles } from "../lib/auth/service";
import { createPrismaClient } from "../lib/prisma-factory";
import { seedFingerprint } from "../lib/questions/seed-import";
import type { SeedQuestion } from "../prisma/seed-data/question-factory";

type Row = Record<string, unknown>;
const sourcePath = resolve(process.argv[2] ?? "prisma/dev.db");
if (!existsSync(sourcePath)) throw new Error("Source database not found: " + sourcePath);
const source = new DatabaseSync(sourcePath, { readOnly: true });
const target = createPrismaClient();

function table(name: string): Row[] {
  const exists = source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return exists ? source.prepare(`SELECT * FROM "${name}"`).all() as Row[] : [];
}
const date = (value: unknown) => value === null || value === undefined ? null : new Date(typeof value === "number" ? value : String(value));
const text = (value: unknown) => value === null || value === undefined ? null : String(value);
const bool = (value: unknown) => value === 1 || value === true || value === "1" || value === "true";

async function main() {
  await ensureRoles(target);
  const stats = { users: 0, questions: 0, questionsMatched: 0, clues: 0, attempts: 0, contests: 0, topics: 0 };

  for (const user of table("User")) {
    const id = String(user.id);
    const email = String(user.email).trim().toLowerCase();
    if (await target.user.findFirst({ where: { OR: [{ id }, { email }] } })) continue;
    const role = ["STUDENT", "COACH", "QUIZMASTER", "ADMIN"].includes(String(user.role)) ? String(user.role) : "STUDENT";
    await target.user.create({ data: {
      id, email, name: String(user.name), role, roleId: role,
      createdAt: date(user.createdAt) ?? new Date(),
      passwordHash: text(user.passwordHash),
      // Accounts without a password stay LEGACY until a coach sends them an invitation link.
      status: user.passwordHash && user.status === "ACTIVE" ? "ACTIVE" : String(user.status ?? "LEGACY") === "DISABLED" ? "DISABLED" : "LEGACY",
      emailVerifiedAt: date(user.emailVerifiedAt), lastLoginAt: date(user.lastLoginAt),
    } });
    stats.users += 1;
  }

  // Questions: reuse an identical copy already in the hosted bank (one copy per source row), otherwise add it.
  const clueRows = table("RiddleClue");
  const cluesByQuestion = new Map<string, Row[]>();
  for (const clue of clueRows) {
    const list = cluesByQuestion.get(String(clue.questionId)) ?? [];
    list.push(clue); cluesByQuestion.set(String(clue.questionId), list);
  }
  const hosted = await target.question.findMany({
    select: { id: true, subject: true, topic: true, subtopic: true, roundType: true, difficulty: true, questionText: true, answer: true,
      riddleClues: { select: { clueNumber: true, clueText: true, points: true }, orderBy: { clueNumber: "asc" } } },
  });
  const available = new Map<string, string[]>();
  for (const row of hosted) {
    const key = seedFingerprint(row as unknown as SeedQuestion);
    available.set(key, [...(available.get(key) ?? []), row.id]);
  }
  const questionIdMap = new Map<string, string>();
  for (const question of table("Question")) {
    const sourceId = String(question.id);
    if (await target.question.findUnique({ where: { id: sourceId }, select: { id: true } })) {
      questionIdMap.set(sourceId, sourceId); continue;
    }
    const clues = (cluesByQuestion.get(sourceId) ?? [])
      .map((clue) => ({ clueNumber: Number(clue.clueNumber), clueText: String(clue.clueText), points: Number(clue.points) }))
      .sort((a, b) => a.clueNumber - b.clueNumber);
    const key = seedFingerprint({ ...question, riddleClues: clues } as unknown as SeedQuestion);
    const match = available.get(key)?.shift();
    if (match) { questionIdMap.set(sourceId, match); stats.questionsMatched += 1; continue; }
    await target.question.create({ data: {
      id: sourceId,
      subject: String(question.subject), topic: String(question.topic), subtopic: String(question.subtopic),
      roundType: String(question.roundType), difficulty: String(question.difficulty),
      timeLimitSeconds: Number(question.timeLimitSeconds ?? 30), questionText: String(question.questionText),
      answer: String(question.answer), acceptedAnswers: String(question.acceptedAnswers ?? "[]"),
      numericTolerance: question.numericTolerance === null || question.numericTolerance === undefined ? null : Number(question.numericTolerance),
      shortcutSolution: String(question.shortcutSolution), fullSolution: String(question.fullSolution),
      commonTrap: String(question.commonTrap), encouragement: String(question.encouragement),
      repeatedPattern: String(question.repeatedPattern), patternFamily: String(question.patternFamily),
      sourceType: String(question.sourceType ?? "ORIGINAL"), sourceName: text(question.sourceName), sourceUrl: text(question.sourceUrl),
      sourceYear: question.sourceYear === null || question.sourceYear === undefined ? null : Number(question.sourceYear),
      contestStage: text(question.contestStage), videoTimestamp: text(question.videoTimestamp),
      permissionStatus: String(question.permissionStatus ?? "ORIGINAL"),
      ghanaContext: bool(question.ghanaContext), isGhanaContext: bool(question.isGhanaContext),
      isPastQuestion: bool(question.isPastQuestion), isPrivateOnly: bool(question.isPrivateOnly),
      tags: String(question.tags ?? "[]"), examinerFocus: text(question.examinerFocus), markingScheme: text(question.markingScheme),
      reviewStatus: String(question.reviewStatus ?? "LEGACY_UNREVIEWED"), revision: Number(question.revision ?? 1),
      archivedAt: date(question.archivedAt), createdAt: date(question.createdAt) ?? new Date(),
      seedKey: "copied#" + createHash("sha256").update(sourcePath + sourceId).digest("hex").slice(0, 32),
      riddleClues: clues.length ? { create: clues } : undefined,
    } });
    questionIdMap.set(sourceId, sourceId);
    stats.questions += 1; stats.clues += clues.length;
  }

  for (const attempt of table("Attempt")) {
    const id = String(attempt.id);
    const questionId = questionIdMap.get(String(attempt.questionId));
    if (!questionId || await target.attempt.findUnique({ where: { id }, select: { id: true } })) continue;
    if (!await target.user.findUnique({ where: { id: String(attempt.userId) }, select: { id: true } })) continue;
    await target.attempt.create({ data: {
      id, userId: String(attempt.userId), questionId, userAnswer: String(attempt.userAnswer ?? ""),
      isCorrect: bool(attempt.isCorrect), timeTakenSeconds: Number(attempt.timeTakenSeconds ?? 0),
      pointsAwarded: Number(attempt.pointsAwarded ?? 0), mode: String(attempt.mode ?? "SELF_PRACTICE"),
      createdAt: date(attempt.createdAt) ?? new Date(),
    } });
    stats.attempts += 1;
  }

  for (const contest of table("ContestSession")) {
    const id = String(contest.id);
    if (await target.contestSession.findUnique({ where: { id }, select: { id: true } })) continue;
    await target.contestSession.create({ data: {
      id, title: String(contest.title), mode: String(contest.mode),
      teamAScore: Number(contest.teamAScore ?? 0), teamBScore: Number(contest.teamBScore ?? 0), teamCScore: Number(contest.teamCScore ?? 0),
      currentRound: Number(contest.currentRound ?? 1), createdAt: date(contest.createdAt) ?? new Date(),
      status: String(contest.status ?? "COMPLETED"),
    } });
    stats.contests += 1;
  }

  for (const topic of table("Topic")) {
    const exists = await target.topic.findFirst({ where: { OR: [{ id: String(topic.id) }, { subject: String(topic.subject), name: String(topic.name) }] } });
    if (exists) continue;
    await target.topic.create({ data: { id: String(topic.id), subject: String(topic.subject), name: String(topic.name), description: String(topic.description ?? "") } });
    stats.topics += 1;
  }

  console.log("Copied from " + sourcePath + ":", stats);
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { source.close(); await target.$disconnect(); });
