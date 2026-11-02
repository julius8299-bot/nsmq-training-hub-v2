import { NextRequest, NextResponse } from "next/server";
import { checkAnswer } from "@/lib/answer-checker";
import { MODE_POINTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { z } from "zod";


export async function POST(request: NextRequest) {
  try {
  const user = await requireApiUser(request);
  const body = z.object({
    questionId: z.string().min(1).max(100), userAnswer: z.string().max(30_000),
    timeTakenSeconds: z.number().min(0).max(86400).optional(),
    mode: z.string().max(80).optional(), selfCheck: z.boolean().optional(),
    riddleClueNumber: z.number().int().min(1).max(5).optional(),
  }).parse(await readJsonRequest(request, 65536));
  const question = await prisma.question.findUnique({
    where: { id: body.questionId },
    include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
  });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (question.archivedAt || question.isPrivateOnly || !["APPROVED", "LEGACY_UNREVIEWED"].includes(question.reviewStatus)) {
    return NextResponse.json({ error: "Question is unavailable." }, { status: 404 });
  }

  const isCorrect = body.selfCheck
    ? false
    : checkAnswer(String(body.userAnswer || ""), question);
  const scoring = MODE_POINTS[question.roundType] ?? { correct: 1, wrong: 0 };
  const requestedClueNumber = Math.min(Math.max(Number(body.riddleClueNumber || 1), 1), 5);
  const storedRiddlePoints =
    question.riddleClues.find((clue) => clue.clueNumber === requestedClueNumber)?.points ??
    [5, 4, 3, 3, 3][requestedClueNumber - 1];
  const correctPoints = question.roundType === "RIDDLE" ? storedRiddlePoints : scoring.correct;
  const pointsAwarded = isCorrect ? correctPoints : scoring.wrong;

  await prisma.attempt.create({
    data: {
      userId: user.id,
      questionId: question.id,
      userAnswer: String(body.userAnswer || ""),
      isCorrect,
      timeTakenSeconds: Number(body.timeTakenSeconds || 0),
      pointsAwarded,
      mode: String(body.mode || "SELF_PRACTICE"),
    },
  });

  return NextResponse.json({ isCorrect, correctAnswer: question.answer, pointsAwarded });
  } catch (error) { return errorResponse(error); }
}
