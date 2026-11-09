import { NextRequest, NextResponse } from "next/server";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { attemptInput, submitAttempt } from "@/lib/training/draws";

/** Score an answer to a question the server issued. The answer and solutions are returned only now. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const input = attemptInput.parse(await readJsonRequest(request, 65536));
    return NextResponse.json(await submitAttempt(prisma, user.id, input), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
