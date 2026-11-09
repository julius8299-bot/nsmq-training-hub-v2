import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prepareQuestion } from "./editing";

const RIDDLE_POINTS = [5, 4, 3, 3, 3];
export type BankRow = Record<string, unknown> & { importKey: string; visibility: "AI_CHECKED" | "PENDING_REVIEW" };

/**
 * Loads the question bank at deploy time. Rows are matched by importKey (the same key Coach Tools uploads use),
 * so this and manual uploads never duplicate each other. Coach decisions always win: questions a coach has
 * approved, rejected, edited or archived are never overwritten. Only adds or updates; never deletes.
 */
export async function syncBank(db: PrismaClient, rows: BankRow[], log: (message: string) => void = console.log) {
  const tally = { created: 0, updated: 0, unchanged: 0, keptCoachVersion: 0, invalid: 0 };
  for (let start = 0; start < rows.length; start += 400) {
    const chunk = rows.slice(start, start + 400);
    const keys = chunk.map((row) => "import:" + row.importKey);
    const existing = new Map((await db.question.findMany({
      where: { seedKey: { in: keys } },
      select: { id: true, seedKey: true, reviewStatus: true, archivedAt: true, pendingEditJson: true, revision: true, shortcutSolution: true, answer: true, questionText: true },
    })).map((row) => [row.seedKey!, row]));
    const newQuestions: Record<string, unknown>[] = [];
    const newClues: { questionId: string; clueNumber: number; clueText: string; points: number }[] = [];
    for (const row of chunk) {
      let prepared;
      try { prepared = prepareQuestion(row); } catch { tally.invalid += 1; continue; }
      const seedKey = "import:" + row.importKey;
      const current = existing.get(seedKey);
      const status = row.visibility;
      const clues = prepared.clues.length
        ? { create: prepared.clues.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: RIDDLE_POINTS[index] })) } : undefined;
      if (!current) {
        // Batched inserts with deterministic ids: the database is far from the build server, so round trips matter.
        const id = "qb_" + createHash("sha256").update(seedKey).digest("hex").slice(0, 24);
        newQuestions.push({ ...prepared.fields, id, seedKey, reviewStatus: status, isPrivateOnly: status !== "AI_CHECKED" });
        prepared.clues.forEach((clueText, index) => newClues.push({ questionId: id, clueNumber: index + 1, clueText, points: RIDDLE_POINTS[index] }));
        tally.created += 1; continue;
      }
      // APPROVED/REJECTED/archived, or a pending coach edit: a person has decided, so leave it alone.
      if (current.archivedAt || current.pendingEditJson || !["PENDING_REVIEW", "AI_CHECKED"].includes(current.reviewStatus)) { tally.keptCoachVersion += 1; continue; }
      if (current.reviewStatus === status && current.shortcutSolution === prepared.fields.shortcutSolution
        && current.answer === prepared.fields.answer && current.questionText === prepared.fields.questionText) { tally.unchanged += 1; continue; }
      await db.$transaction([
        db.riddleClue.deleteMany({ where: { questionId: current.id } }),
        db.question.update({ where: { id: current.id }, data: {
          ...prepared.fields, reviewStatus: status, isPrivateOnly: status !== "AI_CHECKED", revision: { increment: 1 }, riddleClues: clues,
        } }),
      ]);
      tally.updated += 1;
    }
    if (newQuestions.length) {
      await db.question.createMany({ data: newQuestions as never });
      if (newClues.length) await db.riddleClue.createMany({ data: newClues });
    }
    log(`  bank: ${Math.min(start + 400, rows.length)} / ${rows.length}`);
  }
  return tally;
}
