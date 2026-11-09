import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { isStudentVisible } from "@/lib/questions/visibility";

const reportInput = z.object({ reason: z.string().trim().min(3).max(1000) }).strict();

/** A student flags a wrong answer or confusing question; it is tagged "reported" and the note is kept for coaches. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(request);
    const { reason } = reportInput.parse(await readJsonRequest(request, 8 * 1024));
    const question = await prisma.question.findUnique({ where: { id: (await params).id } });
    if (!question || !isStudentVisible(question)) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    const tags: string[] = (() => { try { return JSON.parse(question.tags); } catch { return []; } })();
    const line = `Report from ${user.name} (${new Date().toISOString().slice(0, 10)}): ${reason}`;
    await prisma.question.update({ where: { id: question.id }, data: {
      tags: JSON.stringify([...new Set([...tags, "reported"])]),
      reviewerNote: [question.reviewerNote, line].filter(Boolean).join("\n").slice(-10_000),
    } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
