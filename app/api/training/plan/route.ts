import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { dailyPlan } from "@/lib/training/daily-plan";

export const dynamic = "force-dynamic";

/** Today's training plan and progress for the signed-in student. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    return NextResponse.json(await dailyPlan(prisma, user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
