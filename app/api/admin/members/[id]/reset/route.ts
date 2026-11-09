import { NextRequest, NextResponse } from "next/server";
import { errorResponse, publicBaseUrl, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { createPasswordReset } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";

/** A one-use link (24 hours) the coach sends privately, e.g. on WhatsApp. Shown once. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiUser(request, "members:manage");
    await readJsonRequest(request, 256);
    const { id } = await context.params;
    const result = await createPasswordReset(prisma, { userId: id, actorId: actor.id });
    const reset = result.invitation.purpose === "RESET";
    return NextResponse.json({
      purpose: result.invitation.purpose,
      expiresAt: result.invitation.expiresAt,
      url: new URL("/accept-invite#token=" + result.token + (reset ? "&reset=1" : ""), publicBaseUrl(request)).toString(),
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
