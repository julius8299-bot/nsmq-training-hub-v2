import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const required = ["subject", "topic", "subtopic", "roundType", "difficulty", "questionText", "answer", "shortcutSolution", "fullSolution", "commonTrap", "encouragement", "repeatedPattern", "patternFamily", "sourceType", "permissionStatus"];
  const missing = required.filter((field) => !String(body[field] ?? "").trim());
  if (missing.length) return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  const riddleClues = Array.isArray(body.riddleClues) ? body.riddleClues : [];
  if (body.roundType === "RIDDLE" && ((riddleClues.length < 4 || riddleClues.length > 5) || riddleClues.some((clue: { clueText?: string }) => !clue.clueText?.trim()))) {
    return NextResponse.json({ error: "Riddles require four or five completed clues." }, { status: 400 });
  }
  delete body.id;
  delete body.createdAt;
  delete body.updatedAt;
  delete body.riddleClues;
  const question = await prisma.$transaction(async (tx) => {
    await tx.riddleClue.deleteMany({ where: { questionId: id } });
    return tx.question.update({
      where: { id },
      data: {
        ...body,
        timeLimitSeconds: Number(body.timeLimitSeconds),
        sourceYear: body.sourceYear ? Number(body.sourceYear) : null,
        numericTolerance: body.numericTolerance ? Number(body.numericTolerance) : null,
        ghanaContext: body.ghanaContext === true || body.ghanaContext === "true" || body.isGhanaContext === true || body.isGhanaContext === "true",
        isGhanaContext: body.isGhanaContext === true || body.isGhanaContext === "true" || body.ghanaContext === true || body.ghanaContext === "true",
        isPastQuestion: body.isPastQuestion === true || body.isPastQuestion === "true",
        isPrivateOnly: body.isPrivateOnly === true || body.isPrivateOnly === "true",
        riddleClues: riddleClues.length
          ? { create: riddleClues.map((clue: { clueNumber: number; clueText: string }, index: number) => ({ clueNumber: Number(clue.clueNumber), clueText: clue.clueText, points: [5, 4, 3, 3, 3][index] })) }
          : undefined,
      },
      include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    });
  });
  return NextResponse.json(question);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
