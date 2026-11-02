import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { acceptInvitation, emailSchema, passwordSchema } from "@/lib/auth/service";
import { assertSameOrigin, errorResponse, readJsonRequest } from "@/lib/auth/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = z.object({
      token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
      email: emailSchema, name: z.string().trim().min(1).max(100), password: passwordSchema,
    }).strict().parse(await readJsonRequest(request, 8192));
    await acceptInvitation(prisma, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
