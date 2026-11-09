import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { canManageUser, ROLES } from "@/lib/auth/policy";
import { AccessError } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";

/** Disable / re-enable an account, or (admins only) change its role. Disabling signs the member out everywhere. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiUser(request, "members:manage");
    const { id } = await context.params;
    const input = z.object({ status: z.enum(["ACTIVE", "DISABLED"]).optional(), role: z.enum(ROLES).optional() }).strict()
      .parse(await readJsonRequest(request, 1024));
    if (id === actor.id) throw new AccessError(400, "You cannot change your own account here.");
    const member = await prisma.user.findUnique({ where: { id } });
    if (!member) throw new AccessError(404, "Member not found.");
    const currentRole = member.roleId ?? member.role;
    if (!canManageUser(actor.role, currentRole)) throw new AccessError(403, "You cannot manage this member.");
    if (input.role && actor.role !== "ADMIN") throw new AccessError(403, "Only an administrator can change roles.");
    if (input.status === "ACTIVE" && !member.passwordHash) throw new AccessError(400, "This member has not activated an account yet. Send an invitation link.");
    if ((input.status === "DISABLED" || (input.role && input.role !== "ADMIN")) && currentRole === "ADMIN") {
      const otherAdmins = await prisma.user.count({ where: { id: { not: id }, roleId: "ADMIN", status: "ACTIVE" } });
      if (!otherAdmins) throw new AccessError(400, "Keep at least one active administrator.");
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { ...(input.status && { status: input.status }), ...(input.role && { role: input.role, roleId: input.role }) } }),
      ...(input.status === "DISABLED" ? [prisma.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })] : []),
      prisma.auditEvent.create({ data: { actorId: actor.id, action: "MEMBER_UPDATED", entityType: "User", entityId: id, metadata: JSON.stringify(input) } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
