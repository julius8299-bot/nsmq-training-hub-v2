import { NextRequest, NextResponse } from "next/server";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { createDraw, drawInput } from "@/lib/training/draws";

/** Start a question: the server records when it was shown and which clues the student has seen. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const input = drawInput.parse(await readJsonRequest(request, 4096));
    return NextResponse.json(await createDraw(prisma, user.id, input), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
