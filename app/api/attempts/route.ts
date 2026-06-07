import { NextRequest, NextResponse } from "next/server";
import { checkAnswer } from "@/lib/answer-checker";
import { MODE_POINTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "student@nsmqhub.local";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const question = await prisma.question.findUnique({ where: { id: body.questionId } });
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
  const riddlePoints = body.riddlePoints ? Number(body.riddlePoints) : scoring.correct;
  const pointsAwarded = isCorrect ? riddlePoints : scoring.wrong;

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
