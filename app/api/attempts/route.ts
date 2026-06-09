import { NextRequest, NextResponse } from "next/server";
import { checkAnswer } from "@/lib/answer-checker";
import { MODE_POINTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "student@nsmqhub.local";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const question = await prisma.question.findUnique({
    where: { id: body.questionId },
    include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
  });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { name: "Demo Student", email: DEMO_EMAIL, role: "STUDENT" },
  });

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
}
