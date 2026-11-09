import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { archiveQuestion, editQuestion } from "@/lib/questions/editing";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireApiUser(request, "questions:write");
    const { id } = await params;
    const result = await editQuestion(prisma, actor, id, await readJsonRequest(request));
    return NextResponse.json({ ...result.question, pendingEdit: result.pending });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireApiUser(request, "questions:write");
    const { id } = await params;
    await archiveQuestion(prisma, actor, id);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
