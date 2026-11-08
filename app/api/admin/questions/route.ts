import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { errorResponse, intParam, requireApiUser } from "@/lib/auth/http";
import { DIFFICULTIES, ROUND_TYPES, SUBJECTS } from "@/lib/constants";
import { containsText, prisma } from "@/lib/prisma";
import { SHORTCUT_PENDING } from "@/lib/questions/editing";
import { PUBLISHED_STATUSES } from "@/lib/questions/visibility";

const STATUS_FILTERS = ["queue", "pending", "edits", "live", "rejected", "archived", "all"] as const;

/** Staff view of the whole bank, including drafts, proposed edits and review history. */
export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, "questions:write");
    const params = request.nextUrl.searchParams;
    const status = z.enum(STATUS_FILTERS).default("queue").parse(params.get("status") || undefined);
    const subject = z.enum(SUBJECTS).optional().parse(params.get("subject") || undefined);
    const roundType = z.enum(ROUND_TYPES).optional().parse(params.get("roundType") || undefined);
    const difficulty = z.enum(DIFFICULTIES).optional().parse(params.get("difficulty") || undefined);
    const search = params.get("search")?.trim().slice(0, 200);
    // shortcut=ready hides imported questions still waiting for a shortcut; shortcut=missing shows only those.
    const shortcut = z.enum(["ready", "missing"]).optional().parse(params.get("shortcut") || undefined);
    const shortcutFilter: Prisma.QuestionWhereInput = shortcut === "ready"
      ? { NOT: { shortcutSolution: { startsWith: SHORTCUT_PENDING } } }
      : shortcut === "missing" ? { shortcutSolution: { startsWith: SHORTCUT_PENDING } } : {};
    const page = intParam(request, "page", 1, 1, 100_000);
    const pageSize = intParam(request, "pageSize", 20, 1, 100);
    const byStatus: Record<(typeof STATUS_FILTERS)[number], Prisma.QuestionWhereInput> = {
      queue: { archivedAt: null, OR: [{ reviewStatus: "PENDING_REVIEW" }, { pendingEditJson: { not: null } }] },
      pending: { archivedAt: null, reviewStatus: "PENDING_REVIEW" },
      edits: { archivedAt: null, pendingEditJson: { not: null } },
      live: { archivedAt: null, isPrivateOnly: false, reviewStatus: { in: [...PUBLISHED_STATUSES] } },
      rejected: { archivedAt: null, reviewStatus: "REJECTED" },
      archived: { archivedAt: { not: null } },
      all: {},
    };
    const where: Prisma.QuestionWhereInput = {
      AND: [
        byStatus[status],
        shortcutFilter, subject ? { subject } : {}, roundType ? { roundType } : {}, difficulty ? { difficulty } : {},
        search ? { OR: [{ questionText: containsText(search) }, { answer: containsText(search) }, { topic: containsText(search) }, { tags: containsText(search) }] } : {},
      ],
    };
    const [rows, total, counts] = await Promise.all([
      prisma.question.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        include: {
          riddleClues: { orderBy: { clueNumber: "asc" } },
          createdBy: { select: { id: true, name: true } },
          reviews: { orderBy: { createdAt: "desc" }, take: 1, include: { reviewer: { select: { name: true } } } },
        },
      }),
      prisma.question.count({ where }),
      Promise.all(STATUS_FILTERS.filter((key) => key !== "all").map(async (key) => [key, await prisma.question.count({ where: byStatus[key] })] as const)),
    ]);
    const proposers = new Set(rows.flatMap((row) => row.pendingEditJson ? [JSON.parse(row.pendingEditJson).proposedById as string] : []));
    const names = new Map((await prisma.user.findMany({ where: { id: { in: [...proposers] } }, select: { id: true, name: true } })).map((user) => [user.id, user.name]));
    const questions = rows.map(({ pendingEditJson, ...row }) => {
      const pendingEdit = pendingEditJson ? JSON.parse(pendingEditJson) : null;
      return { ...row, pendingEdit: pendingEdit && { ...pendingEdit, proposedByName: names.get(pendingEdit.proposedById) ?? "Unknown" } };
    });
    return NextResponse.json({ questions, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), counts: Object.fromEntries(counts) });
  } catch (error) { return errorResponse(error); }
}
