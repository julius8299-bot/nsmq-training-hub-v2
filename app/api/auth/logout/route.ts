import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/crypto";
import { assertSameOrigin, errorResponse, SESSION_COOKIE, setSessionCookie } from "@/lib/auth/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) await prisma.authSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() },
    });
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, "", 0);
    return response;
  } catch (error) { return errorResponse(error); }
}
