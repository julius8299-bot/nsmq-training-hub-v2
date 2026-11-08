import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { login } from "@/lib/auth/service";
import { assertSameOrigin, clientNetwork, errorResponse, setSessionCookie, readJsonRequest } from "@/lib/auth/http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = z.object({ email: z.string().max(254), password: z.string().min(1).max(128) }).strict().parse(await readJsonRequest(request, 8192));
    const session = await login(prisma, body.email, body.password, clientNetwork(request));
    const response = NextResponse.json({ ok: true });
    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, session.token);
    return response;
  } catch (error) { return errorResponse(error); }
}
