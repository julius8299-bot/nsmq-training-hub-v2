import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { weeklyLeaderboard } from "@/lib/training/stats";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const leaders = await weeklyLeaderboard(prisma);
    return NextResponse.json({ leaders, you: user.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
