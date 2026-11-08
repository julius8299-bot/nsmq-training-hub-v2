import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";

/** Team members. Admins see everyone; coaches see students. */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "members:manage");
    const members = await prisma.user.findMany({
      where: actor.role === "ADMIN" ? {} : { roleId: "STUDENT" },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, roleId: true, role: true, status: true, lastLoginAt: true, createdAt: true, passwordHash: true },
    });
    return NextResponse.json({
      members: members.map(({ passwordHash, roleId, role, ...member }) => ({ ...member, role: roleId ?? role, hasPassword: Boolean(passwordHash) })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
