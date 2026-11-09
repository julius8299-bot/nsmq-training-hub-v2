import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { SeedQuestion } from "../../prisma/seed-data/question-factory";
import { seedFingerprint } from "./seed-import";

type CatalogQuestion = Omit<SeedQuestion, "sourceType" | "permissionStatus" | "isPastQuestion" | "isPrivateOnly"> & {
  sourceType?: string;
  permissionStatus?: string;
  sourceName?: string;
};

/**
 * Fast, idempotent catalog loader for a fresh hosted database.
 * Copies already present (matched by content fingerprint, counted per copy) are skipped,
 * so it never duplicates, edits or removes existing questions, clues, users or attempts.
 */
export async function importCatalog(
  db: PrismaClient,
  questions: CatalogQuestion[],
  options: { reviewStatus: "LEGACY_UNREVIEWED" | "AUTO_VERIFIED"; sourceName: string; batchSize?: number },
) {
  const existing = await db.question.findMany({
    select: {
      seedKey: true, subject: true, topic: true, subtopic: true, roundType: true, difficulty: true,
      questionText: true, answer: true,
      riddleClues: { select: { clueNumber: true, clueText: true, points: true }, orderBy: { clueNumber: "asc" } },
    },
  });
  // The catalog legitimately repeats identical items, so match by count (a multiset), not by presence:
  // if the database already holds k copies of a fingerprint, only the remaining copies are inserted.
  const present = new Map<string, number>();
  const usedKeys = new Set<string>();
  for (const row of existing) {
    if (row.seedKey) usedKeys.add(row.seedKey);
    const fingerprint = seedFingerprint(row as unknown as SeedQuestion);
    present.set(fingerprint, (present.get(fingerprint) ?? 0) + 1);
  }

  const pending: { id: string; seedKey: string; question: CatalogQuestion }[] = [];
  const seen = new Map<string, number>();
  for (const question of questions) {
    const fingerprint = seedFingerprint(question as SeedQuestion);
    const occurrence = (seen.get(fingerprint) ?? 0) + 1;
    seen.set(fingerprint, occurrence);
    if (occurrence <= (present.get(fingerprint) ?? 0)) continue;
    let seedKey = fingerprint + "#" + occurrence;
    for (let suffix = 2; usedKeys.has(seedKey); suffix += 1) seedKey = fingerprint + "#" + occurrence + "." + suffix;
    usedKeys.add(seedKey);
    const id = "q_" + createHash("sha256").update(seedKey).digest("hex").slice(0, 24);
    pending.push({ id, seedKey, question });
  }

  const batchSize = options.batchSize ?? 200;
  for (let start = 0; start < pending.length; start += batchSize) {
    const batch = pending.slice(start, start + batchSize);
    await db.$transaction([
      db.question.createMany({
        data: batch.map(({ id, seedKey, question }) => {
          const { riddleClues: _clues, acceptedAnswers, tags, ...fields } = question;
          return {
            ...fields,
            id, seedKey,
            acceptedAnswers: JSON.stringify(acceptedAnswers),
            tags: JSON.stringify(tags),
            sourceType: question.sourceType ?? "ORIGINAL",
            permissionStatus: question.permissionStatus ?? "ORIGINAL",
            sourceName: question.sourceName ?? options.sourceName,
            isPastQuestion: false,
            isPrivateOnly: false,
            reviewStatus: options.reviewStatus,
          };
        }),
      }),
      db.riddleClue.createMany({
        data: batch.flatMap(({ id, question }) => (question.riddleClues ?? []).map((clue) => ({
          id: id + "_c" + clue.clueNumber, questionId: id, clueNumber: clue.clueNumber,
          clueText: clue.clueText, points: clue.points,
        }))),
      }),
    ]);
  }
  return { inserted: pending.length, skipped: questions.length - pending.length };
}
