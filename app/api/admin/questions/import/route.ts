import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { importQuestions } from "@/lib/questions/bulk-import";

export const maxDuration = 60;

/** Bulk import of up to 300 rows; see importQuestions for duplicate and re-upload rules. */
export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "questions:write");
    const { rows } = z.object({ rows: z.array(z.record(z.string(), z.unknown())).min(1).max(300) }).strict()
      .parse(await readJsonRequest(request, 4 * 1024 * 1024));
    return NextResponse.json({ results: await importQuestions(prisma, actor.id, rows) }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
