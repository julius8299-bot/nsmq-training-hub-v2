import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { pickQuestions, trainingFilterSchema } from "@/lib/training/questions";

export const dynamic = "force-dynamic";

/** A random set of distinct questions for a round, without answers. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const filter = trainingFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const exclude = request.nextUrl.searchParams.get("exclude")?.split(",").filter(Boolean).slice(0, 200) ?? [];
    const questions = await pickQuestions(prisma, user.id, filter, exclude);
    return NextResponse.json({ questions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
