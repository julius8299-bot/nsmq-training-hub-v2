import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { reviewInput, reviewQuestion } from "@/lib/questions/editing";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiUser(request, "questions:review");
    const { id } = await context.params;
    await reviewQuestion(prisma, actor, id, reviewInput.parse(await readJsonRequest(request, 16_384)));
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
