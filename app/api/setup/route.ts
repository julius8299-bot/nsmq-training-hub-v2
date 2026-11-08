import { timingSafeEqual, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AccessError, createBootstrapInvitation, emailSchema } from "@/lib/auth/service";
import { assertSameOrigin, errorResponse, publicBaseUrl, readJsonRequest } from "@/lib/auth/http";

export const runtime = "nodejs";

/** One-time creation of the first administrator. Works only while SETUP_SECRET is set and no admin exists. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const configured = process.env.SETUP_SECRET ?? "";
    if (configured.length < 24) throw new AccessError(404, "Setup is not enabled.");
    const body = z.object({ secret: z.string().max(512), email: emailSchema }).strict().parse(await readJsonRequest(request, 4096));
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!timingSafeEqual(digest(body.secret), digest(configured))) {
      await new Promise((done) => setTimeout(done, 1000));
      throw new AccessError(403, "The setup secret is incorrect.");
    }
    const token = await createBootstrapInvitation(prisma, body.email);
    return NextResponse.json({
      acceptanceUrl: new URL("/accept-invite#token=" + token, publicBaseUrl(request)).toString(),
      expiresInMinutes: 30,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
