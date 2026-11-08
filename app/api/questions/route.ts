import { NextRequest, NextResponse } from "next/server";
import { prisma, containsText } from "@/lib/prisma";
import { errorResponse, intParam, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { createQuestion } from "@/lib/questions/editing";
import { studentVisible } from "@/lib/questions/visibility";
import { publicQuestion, trainingWhere, trainingFilterSchema } from "@/lib/training/questions";

export const dynamic = "force-dynamic";

/**
 * Question Bank (study mode, ?page=N): answers and solutions are shown on purpose so students can study.
 * Without ?page the list is answer-free; training rounds use /api/training/questions instead.
 */
export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const params = request.nextUrl.searchParams;
    if (params.get("includePrivate") === "true") await requireApiUser(request, "questions:write");
    const filter = trainingFilterSchema.parse({ ...Object.fromEntries(params), limit: undefined });
    const search = params.get("search")?.trim().slice(0, 200);
    const where = {
      ...trainingWhere(filter),
      ...(params.get("includePrivate") === "true" && { reviewStatus: undefined, isPrivateOnly: undefined }),
      ...(params.get("sourceType") && { sourceType: params.get("sourceType")! }),
      ...(params.get("timeLimit") && { timeLimitSeconds: { lte: intParam(request, "timeLimit", 3600, 1, 3600) } }),
      ...(params.get("repeatedPattern") && { repeatedPattern: containsText(params.get("repeatedPattern")!.slice(0, 200)) }),
      ...(search && {
        OR: [
          { questionText: containsText(search) }, { topic: containsText(search) },
          { subtopic: containsText(search) }, { tags: containsText(search) },
        ],
      }),
    };

    if (params.get("metadata") === "true") {
      const base = { ...studentVisible, ...(filter.subject && { subject: filter.subject }) };
      const [topics, subtopics, patternFamilies] = await Promise.all([
        prisma.question.findMany({ where: base, distinct: ["topic"], select: { topic: true }, orderBy: { topic: "asc" } }),
        prisma.question.findMany({ where: { ...base, ...(filter.topic && { topic: filter.topic }) }, distinct: ["subtopic"], select: { subtopic: true }, orderBy: { subtopic: "asc" } }),
        prisma.question.findMany({ where: base, distinct: ["patternFamily"], select: { patternFamily: true }, orderBy: { patternFamily: "asc" } }),
      ]);
      return NextResponse.json({
        topics: topics.map((item) => item.topic),
        subtopics: subtopics.map((item) => item.subtopic),
        patternFamilies: patternFamilies.map((item) => item.patternFamily),
      });
    }

    if (params.has("page")) {
      const pageSize = intParam(request, "pageSize", 24, 1, 60);
      const page = intParam(request, "page", 1, 1, 100_000);
      const [questions, total] = await Promise.all([
        prisma.question.findMany({
          where, include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
          skip: (page - 1) * pageSize, take: pageSize,
          orderBy: [{ subject: "asc" }, { topic: "asc" }, { createdAt: "desc" }, { id: "asc" }],
        }),
        prisma.question.count({ where }),
      ]);
      return NextResponse.json({ questions, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    }

    const take = intParam(request, "limit", 20, 1, 250);
    const questions = await prisma.question.findMany({ where, include: { riddleClues: true }, take, orderBy: { createdAt: "desc" } });
    return NextResponse.json(questions.map(publicQuestion));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "questions:write");
    const question = await createQuestion(prisma, actor.id, await readJsonRequest(request));
    return NextResponse.json(question, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
