import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { DIFFICULTIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { problemOfTheDay } from "@/lib/training/questions";

/** Today's Problem of the Day: the same for every student, changing at midnight GMT (Ghana time). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const difficulty = z.enum(DIFFICULTIES).optional().parse(request.nextUrl.searchParams.get("difficulty") || undefined);
    const today = await problemOfTheDay(prisma, difficulty);
    if (!today) return NextResponse.json({ problem: null });
    const start = new Date(today.date + "T00:00:00.000Z");
    const attempted = await prisma.attempt.findFirst({
      where: { userId: user.id, questionId: today.question.id, createdAt: { gte: start } },
      select: { isCorrect: true, countsTowardStats: true },
    });
    return NextResponse.json({ problem: today.question, date: today.date, attemptedToday: Boolean(attempted) });
  } catch (error) { return errorResponse(error); }
}
