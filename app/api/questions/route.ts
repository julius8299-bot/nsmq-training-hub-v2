import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const wantsMeta = searchParams.get("meta") === "true";

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(5000, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  const search = searchParams.get("search")?.trim() || "";
  const subject = searchParams.get("subject") || "";
  const topic = searchParams.get("topic") || "";
  const subtopic = searchParams.get("subtopic") || "";
  const roundType = searchParams.get("roundType") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const sourceType = searchParams.get("sourceType") || "";
  const patternFamily = searchParams.get("patternFamily") || "";
  const repeatedPattern = searchParams.get("repeatedPattern") || "";
  const ghanaContext =
    searchParams.get("ghanaContext") === "true" ||
    searchParams.get("isGhanaContext") === "true";

  const where: any = {};

  if (subject) where.subject = subject;
  if (topic) where.topic = topic;
  if (subtopic) where.subtopic = subtopic;
  if (roundType) where.roundType = roundType;
  if (difficulty) where.difficulty = difficulty;
  if (sourceType) where.sourceType = sourceType;
  if (patternFamily) where.patternFamily = patternFamily;
  if (repeatedPattern) where.repeatedPattern = { contains: repeatedPattern };
  if (ghanaContext) where.isGhanaContext = true;

  if (search) {
    where.OR = [
      { questionText: { contains: search } },
      { answer: { contains: search } },
      { topic: { contains: search } },
      { subtopic: { contains: search } },
      { repeatedPattern: { contains: search } },
      { patternFamily: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const questions = await prisma.question.findMany({
    where,
    include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Backward compatible mode for Practice, Speed Race, POTD, T/F, Full Contest.
  if (!wantsMeta) {
    return NextResponse.json(questions);
  }

  const [total, allForFacets] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      select: {
        subject: true,
        topic: true,
        subtopic: true,
        patternFamily: true,
        sourceType: true,
        roundType: true,
        difficulty: true,
        timeLimitSeconds: true,
      },
    }),
  ]);

  const unique = (values: any[]) =>
    [...new Set(values.filter(Boolean))].sort();

  return NextResponse.json({
    questions,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    page,
    limit,
    facets: {
      subjects: unique(allForFacets.map((q) => q.subject)),
      topics: unique(allForFacets.map((q) => q.topic)),
      subtopics: unique(allForFacets.map((q) => q.subtopic)),
      patternFamilies: unique(allForFacets.map((q) => q.patternFamily)),
      sourceTypes: unique(allForFacets.map((q) => q.sourceType)),
      roundTypes: unique(allForFacets.map((q) => q.roundType)),
      difficulties: unique(allForFacets.map((q) => q.difficulty)),
      timeLimits: unique(allForFacets.map((q) => q.timeLimitSeconds)),
    },
  });
}
