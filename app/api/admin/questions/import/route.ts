import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { AccessError } from "@/lib/auth/service";
import { prepareQuestion } from "@/lib/questions/editing";

const RIDDLE_POINTS = [5, 4, 3, 3, 3];
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Bulk import of up to 300 rows. Every row is validated on the server, exact duplicates of existing
 * questions are skipped, and everything imported waits in the review queue (private) until approved.
 */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "questions:write");
    const { rows } = z.object({ rows: z.array(z.record(z.string(), z.unknown())).min(1).max(300) }).strict()
      .parse(await readJsonRequest(request, 4 * 1024 * 1024));
    const results: { row: number; status: "imported" | "duplicate" | "error"; message?: string; id?: string }[] = [];
    const prepared: { row: number; value: ReturnType<typeof prepareQuestion> }[] = [];
    rows.forEach((raw, index) => {
      try { prepared.push({ row: index + 1, value: prepareQuestion(raw) }); }
      catch (error) {
        const message = error instanceof z.ZodError
          ? error.issues.slice(0, 3).map((issue) => (issue.path.join(".") || "row") + ": " + issue.message).join("; ")
          : error instanceof AccessError ? error.message : "Invalid row.";
        results.push({ row: index + 1, status: "error", message });
      }
    });
    const existing = await prisma.question.findMany({
      where: { archivedAt: null, questionText: { in: prepared.map((item) => item.value.fields.questionText) } },
      select: { subject: true, roundType: true, questionText: true, answer: true },
    });
    const key = (item: { subject: string; roundType: string; questionText: string; answer: string }) =>
      [item.subject, item.roundType, normalize(item.questionText), normalize(item.answer)].join("|");
    const seen = new Set(existing.map(key));
    for (const { row, value } of prepared) {
      if (seen.has(key(value.fields))) { results.push({ row, status: "duplicate", message: "Already in the bank." }); continue; }
      seen.add(key(value.fields));
      const created = await prisma.question.create({
        data: {
          ...value.fields, createdById: actor.id, reviewStatus: "PENDING_REVIEW", isPrivateOnly: true,
          riddleClues: value.clues.length ? { create: value.clues.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: RIDDLE_POINTS[index] })) } : undefined,
        },
        select: { id: true },
      });
      results.push({ row, status: "imported", id: created.id });
    }
    await prisma.auditEvent.create({ data: {
      actorId: actor.id, action: "QUESTIONS_IMPORTED", entityType: "Question",
      metadata: JSON.stringify({ imported: results.filter((item) => item.status === "imported").length, rows: rows.length }),
    } });
    results.sort((a, b) => a.row - b.row);
    return NextResponse.json({ results }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
