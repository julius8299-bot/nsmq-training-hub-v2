import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AccessError } from "@/lib/auth/service";
import { prepareQuestion, type PreparedQuestion } from "./editing";
import { isStudentVisible } from "./visibility";

const RIDDLE_POINTS = [5, 4, 3, 3, 3];
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const importKeySchema = z.string().trim().min(1).max(200).regex(/^[\w.:#/-]+$/, "Use letters, numbers and . : # / - _ only.");

export type ImportResult = { row: number; status: "imported" | "updated" | "unchanged" | "duplicate" | "error"; message?: string; id?: string };

const clueRows = (clues: string[]) => clues.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: RIDDLE_POINTS[index] }));
type Content = { subject: string; roundType: string; questionText: string; answer: string; preamble?: string | null };
/** Same subject, round, stem, question, answer and clues: riddles sharing "Who am I?" but with different clues stay distinct. */
const contentKey = (item: Content, clues: string[]) =>
  [item.subject, item.roundType, normalize(item.preamble ?? ""), normalize(item.questionText), normalize(item.answer), normalize(clues.join(" "))].join("|");

function sameContent(existing: Record<string, unknown> & { riddleClues: { clueText: string }[] }, prepared: PreparedQuestion) {
  const fieldsSame = Object.entries(prepared.fields).every(([key, value]) => String(existing[key] ?? "") === String(value ?? ""));
  return fieldsSame && JSON.stringify(existing.riddleClues.map((clue) => clue.clueText)) === JSON.stringify(prepared.clues);
}

/**
 * Bulk import. Every row is validated; everything new waits in the review queue (private).
 * Rows with an `importKey` can be uploaded again later (for example with shortcuts added): an unpublished
 * question is updated in place and stays in review; a published one gets the change as a pending edit.
 * Rows without a key are skipped when the same question and answer are already in the bank.
 */
export async function importQuestions(db: PrismaClient, actorId: string, rows: Record<string, unknown>[]) {
  const results: ImportResult[] = [];
  const prepared: { row: number; key: string | null; value: PreparedQuestion }[] = [];
  rows.forEach((raw, index) => {
    try {
      const key = raw.importKey === undefined || raw.importKey === "" ? null : "import:" + importKeySchema.parse(raw.importKey);
      prepared.push({ row: index + 1, key, value: prepareQuestion(raw) });
    } catch (error) {
      const message = error instanceof z.ZodError
        ? error.issues.slice(0, 3).map((issue) => (issue.path.join(".") || "importKey") + ": " + issue.message).join("; ")
        : error instanceof AccessError ? error.message : "Invalid row.";
      results.push({ row: index + 1, status: "error", message });
    }
  });
  const keys = prepared.flatMap((item) => item.key ? [item.key] : []);
  const keyed = new Map((await db.question.findMany({
    where: { seedKey: { in: keys } }, include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
  })).map((question) => [question.seedKey!, question]));
  const existing = await db.question.findMany({
    where: { archivedAt: null, questionText: { in: prepared.filter((item) => !item.key || !keyed.has(item.key)).map((item) => item.value.fields.questionText) } },
    select: { subject: true, roundType: true, questionText: true, answer: true, preamble: true, riddleClues: { select: { clueText: true }, orderBy: { clueNumber: "asc" } } },
  });
  const seen = new Set(existing.map((item) => contentKey(item, item.riddleClues.map((clue) => clue.clueText))));
  const seenKeys = new Set<string>();
  let imported = 0, updated = 0;
  for (const { row, key, value } of prepared) {
    if (key && seenKeys.has(key)) { results.push({ row, status: "error", message: "The same importKey appears twice in this upload." }); continue; }
    if (key) seenKeys.add(key);
    const current = key ? keyed.get(key) : undefined;
    if (current) {
      if (current.archivedAt) { results.push({ row, status: "unchanged", id: current.id, message: "Archived; not changed." }); continue; }
      if (sameContent(current as unknown as Record<string, unknown> & { riddleClues: { clueText: string }[] }, value)) {
        results.push({ row, status: "unchanged", id: current.id }); continue;
      }
      if (isStudentVisible(current)) {
        await db.question.update({ where: { id: current.id }, data: {
          pendingEditJson: JSON.stringify({ ...value, proposedById: actorId, proposedAt: new Date().toISOString() }), revision: { increment: 1 },
        } });
        results.push({ row, status: "updated", id: current.id, message: "Live question: saved as an edit for review." });
      } else {
        await db.$transaction(async (tx) => {
          await tx.riddleClue.deleteMany({ where: { questionId: current.id } });
          await tx.question.update({ where: { id: current.id }, data: {
            ...value.fields, revision: { increment: 1 }, reviewStatus: "PENDING_REVIEW", isPrivateOnly: true, pendingEditJson: null,
            riddleClues: value.clues.length ? { create: clueRows(value.clues) } : undefined,
          } });
        });
        results.push({ row, status: "updated", id: current.id });
      }
      updated += 1;
      continue;
    }
    const content = contentKey(value.fields as Content, value.clues);
    if (seen.has(content)) { results.push({ row, status: "duplicate", message: "Already in the bank." }); continue; }
    seen.add(content);
    const created = await db.question.create({
      data: {
        ...value.fields, seedKey: key, createdById: actorId, reviewStatus: "PENDING_REVIEW", isPrivateOnly: true,
        riddleClues: value.clues.length ? { create: clueRows(value.clues) } : undefined,
      },
      select: { id: true },
    });
    imported += 1;
    results.push({ row, status: "imported", id: created.id });
  }
  await db.auditEvent.create({ data: {
    actorId, action: "QUESTIONS_IMPORTED", entityType: "Question", metadata: JSON.stringify({ imported, updated, rows: rows.length }),
  } });
  return results.sort((a, b) => a.row - b.row);
}
