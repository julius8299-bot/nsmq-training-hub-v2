import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { studentOverview } from "@/lib/training/stats";

/** Coach view: every student's recent progress (last 120 days). */
export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, "students:view");
    return NextResponse.json({ students: await studentOverview(prisma) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
