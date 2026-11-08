import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SUBJECTS } from "@/lib/constants";
import { errorResponse, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";
import { SHORTCUT_PENDING } from "@/lib/questions/editing";
import { studentVisible } from "@/lib/questions/visibility";
import { parseShortcut } from "@/lib/text/shortcut";

export const dynamic = "force-dynamic";

/**
 * Shortcut library: published questions grouped by pattern family, each with one worked example
 * (preferring a four-part shortcut). Study material, so answers are included.
 */
export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const params = request.nextUrl.searchParams;
    const subject = z.enum(SUBJECTS).parse(params.get("subject"));
    const topic = params.get("topic")?.trim().slice(0, 200) || undefined;
    const rows = await prisma.question.findMany({
      where: { subject, ...(topic ? { topic } : {}), ...studentVisible, NOT: { shortcutSolution: { startsWith: SHORTCUT_PENDING } } },
      select: { id: true, topic: true, patternFamily: true, questionText: true, preamble: true, answer: true, shortcutSolution: true, roundType: true },
      take: 3000,
    });
    const families = new Map<string, { patternFamily: string; topic: string; count: number; example: (typeof rows)[number]; structured: boolean }>();
    for (const row of rows) {
      if (row.roundType === "RIDDLE") continue;
      const structured = parseShortcut(row.shortcutSolution) !== null;
      const current = families.get(row.patternFamily);
      if (!current) { families.set(row.patternFamily, { patternFamily: row.patternFamily, topic: row.topic, count: 1, example: row, structured }); continue; }
      current.count += 1;
      if (structured && !current.structured) Object.assign(current, { example: row, structured });
    }
    const list = [...families.values()].sort((a, b) => Number(b.structured) - Number(a.structured) || b.count - a.count).slice(0, 60);
    return NextResponse.json({ families: list.map(({ structured: _s, ...family }) => family) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
