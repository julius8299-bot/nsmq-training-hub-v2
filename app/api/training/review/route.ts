import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SUBJECTS } from "@/lib/constants";
import { errorResponse, intParam, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { dueReviewQuestions } from "@/lib/training/review";

export const dynamic = "force-dynamic";

/** Missed questions that are due again for this student (without answers). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const subject = z.enum(SUBJECTS).optional().parse(request.nextUrl.searchParams.get("subject") || undefined);
    const result = await dueReviewQuestions(prisma, user.id, intParam(request, "limit", 10, 1, 30), subject);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
