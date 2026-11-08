import { NextRequest, NextResponse } from "next/server";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { revealNextClue } from "@/lib/training/draws";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser(request);
    await readJsonRequest(request, 256);
    const { id } = await context.params;
    return NextResponse.json(await revealNextClue(prisma, user.id, id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
