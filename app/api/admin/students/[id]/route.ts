import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { AccessError } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";
import { buildDashboard } from "@/lib/training/stats";

/** One student's full training record, plus their latest answers, for a coach. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser(request, "students:view");
    const { id } = await context.params;
    const student = await prisma.user.findFirst({ where: { id, roleId: "STUDENT" }, select: { id: true, name: true, email: true, status: true, lastLoginAt: true } });
    if (!student) throw new AccessError(404, "Student not found.");
    const [dashboard, recent] = await Promise.all([
      buildDashboard(prisma, id),
      prisma.attempt.findMany({
        where: { userId: id }, orderBy: { createdAt: "desc" }, take: 40,
        select: {
          id: true, userAnswer: true, isCorrect: true, pointsAwarded: true, timeTakenSeconds: true, mode: true, createdAt: true, lateSubmission: true,
          question: { select: { subject: true, topic: true, roundType: true, questionText: true, answer: true } },
        },
      }),
    ]);
    return NextResponse.json({ student, dashboard, recent }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
