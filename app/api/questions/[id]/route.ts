import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { questionInput } from "@/lib/questions/input";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const actor = await requireApiUser(request, "questions:write");
  const { id } = await params;
  const body = questionInput.parse(await readJsonRequest(request));
  const required = ["subject", "topic", "subtopic", "roundType", "difficulty", "questionText", "answer", "shortcutSolution", "fullSolution", "commonTrap", "encouragement", "repeatedPattern", "patternFamily", "sourceType", "permissionStatus"];
  const missing = required.filter((field) => !String(body[field as keyof typeof body] ?? "").trim());
  if (missing.length) return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  const riddleClues = Array.isArray(body.riddleClues) ? body.riddleClues : [];
  if (body.roundType === "RIDDLE" && ((riddleClues.length < 4 || riddleClues.length > 5) || riddleClues.some((clue: { clueText?: string }) => !clue.clueText?.trim()))) {
    return NextResponse.json({ error: "Riddles require four or five completed clues." }, { status: 400 });
  }
  delete body.riddleClues;
  const question = await prisma.$transaction(async (tx) => {
    await tx.riddleClue.deleteMany({ where: { questionId: id } });
    return tx.question.update({
      where: { id },
      data: {
        ...body,
        reviewStatus: "PENDING_REVIEW",
        isPrivateOnly: true,
        timeLimitSeconds: Number(body.timeLimitSeconds),
        sourceYear: body.sourceYear ? Number(body.sourceYear) : null,
        numericTolerance: body.numericTolerance ? Number(body.numericTolerance) : null,
        ghanaContext: body.ghanaContext === true || body.ghanaContext === "true" || body.isGhanaContext === true || body.isGhanaContext === "true",
        isGhanaContext: body.isGhanaContext === true || body.isGhanaContext === "true" || body.ghanaContext === true || body.ghanaContext === "true",
        isPastQuestion: body.isPastQuestion === true || body.isPastQuestion === "true",
        riddleClues: riddleClues.length
          ? { create: riddleClues.map((clue: { clueNumber: number; clueText: string }, index: number) => ({ clueNumber: Number(clue.clueNumber), clueText: clue.clueText, points: [5, 4, 3, 3, 3][index] })) }
          : undefined,
      },
      include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    });
  });
  await prisma.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_EDITED", entityType: "Question", entityId: id } });
  return NextResponse.json(question);
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const actor = await requireApiUser(request, "questions:write");
  const { id } = await params;
  await prisma.$transaction([
    prisma.question.update({ where: { id }, data: { archivedAt: new Date() } }),
    prisma.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_ARCHIVED", entityType: "Question", entityId: id } }),
  ]);
  return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
