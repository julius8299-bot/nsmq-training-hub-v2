import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createInvitation, emailSchema } from "@/lib/auth/service";
import { errorResponse, publicBaseUrl, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { ROLES } from "@/lib/auth/policy";

/** Open invitation and reset links (tokens are never stored or shown again; only metadata is listed). */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "members:invite");
    const invitations = await prisma.invitation.findMany({
      where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() }, ...(actor.role !== "ADMIN" && { createdById: actor.id }) },
      orderBy: { createdAt: "desc" }, take: 200,
      select: { id: true, email: true, roleCode: true, purpose: true, expiresAt: true, createdAt: true, createdBy: { select: { name: true } } },
    });
    return NextResponse.json({ invitations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "members:invite");
    const input = z.object({ email: emailSchema, role: z.enum(ROLES) }).strict().parse(await readJsonRequest(request, 8192));
    const result = await createInvitation(prisma, { ...input, actorId: actor.id });
    // The bearer token is returned once to an authorized staff member; it is never stored in plaintext.
    return NextResponse.json({
      id: result.invitation.id, expiresAt: result.invitation.expiresAt,
      acceptanceUrl: new URL("/accept-invite#token=" + result.token, publicBaseUrl(request)).toString(),
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "members:invite");
    const id = z.string().min(1).max(100).parse(request.nextUrl.searchParams.get("id"));
    const result = await prisma.invitation.updateMany({
      where: { id, acceptedAt: null, revokedAt: null, ...(actor.role !== "ADMIN" && { createdById: actor.id }) },
      data: { revokedAt: new Date() },
    });
    if (!result.count) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    await prisma.auditEvent.create({ data: { actorId: actor.id, action: "INVITATION_REVOKED", entityType: "Invitation", entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
