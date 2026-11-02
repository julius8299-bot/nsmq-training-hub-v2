import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { questionInput } from "@/lib/questions/input";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
  await requireApiUser(request);
  const params = request.nextUrl.searchParams;
  const take = Math.min(Number(params.get("limit") || 20), 250);
  const search = params.get("search")?.trim();
  const includePrivate = params.get("includePrivate") === "true";
  if (includePrivate) await requireApiUser(request, "questions:write");
  const wantsGhanaContext = params.get("isGhanaContext") === "true" || params.get("ghanaContext") === "true";
  const difficulty = params.get("difficulty");
  const difficulties = params.get("difficulties")?.split(",").filter(Boolean);

  const where = {
      archivedAt: null,
      ...(!includePrivate && { reviewStatus: { in: ["APPROVED", "LEGACY_UNREVIEWED"] } }),
      ...(!includePrivate && { isPrivateOnly: false }),
      ...(params.get("subject") && { subject: params.get("subject")! }),
      ...(params.get("topic") && { topic: params.get("topic")! }),
      ...(params.get("subtopic") && { subtopic: params.get("subtopic")! }),
      ...(params.get("roundType") && { roundType: params.get("roundType")! }),
      ...(difficulty
        ? { difficulty }
        : difficulties?.length
          ? { difficulty: { in: difficulties } }
          : {}),
      ...(params.get("sourceType") && { sourceType: params.get("sourceType")! }),
      ...(wantsGhanaContext && { isGhanaContext: true }),
      ...(params.get("patternFamily") && {
        patternFamily: { contains: params.get("patternFamily")! },
      }),
      ...(params.get("timeLimit") && {
        timeLimitSeconds: { lte: Number(params.get("timeLimit")) },
      }),
      ...(params.get("repeatedPattern") && {
        repeatedPattern: { contains: params.get("repeatedPattern")! },
      }),
      ...(search && {
        OR: [
          { questionText: { contains: search } },
          { topic: { contains: search } },
          { subtopic: { contains: search } },
          { tags: { contains: search } },
        ],
      }),
    };

  if (params.get("metadata") === "true") {
    const [topics, subtopics, patternFamilies] = await Promise.all([
      prisma.question.findMany({ where, distinct: ["topic"], select: { topic: true }, orderBy: { topic: "asc" } }),
      prisma.question.findMany({ where, distinct: ["subtopic"], select: { subtopic: true }, orderBy: { subtopic: "asc" } }),
      prisma.question.findMany({ where, distinct: ["patternFamily"], select: { patternFamily: true }, orderBy: { patternFamily: "asc" } }),
    ]);
    return NextResponse.json({
      topics: topics.map((item) => item.topic),
      subtopics: subtopics.map((item) => item.subtopic),
      patternFamilies: patternFamilies.map((item) => item.patternFamily),
    });
  }

  if (params.has("page")) {
    const pageSize = Math.min(Math.max(Number(params.get("pageSize") || 24), 1), 60);
    const page = Math.max(Number(params.get("page") || 1), 1);
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ subject: "asc" }, { topic: "asc" }, { createdAt: "desc" }],
      }),
      prisma.question.count({ where }),
    ]);
    return NextResponse.json({
      questions,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }

  const questions = await prisma.question.findMany({
    where,
    include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    take,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
  const actor = await requireApiUser(request, "questions:write");
  const body = questionInput.parse(await readJsonRequest(request));
  const required = ["subject", "topic", "subtopic", "roundType", "difficulty", "questionText", "answer", "shortcutSolution", "fullSolution", "commonTrap", "encouragement", "repeatedPattern", "patternFamily", "sourceType", "permissionStatus"];
  const missing = required.filter((field) => !String(body[field as keyof typeof body] ?? "").trim());
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }
  const riddleClues = Array.isArray(body.riddleClues) ? body.riddleClues : [];
  if (body.roundType === "RIDDLE" && ((riddleClues.length < 4 || riddleClues.length > 5) || riddleClues.some((clue: { clueText?: string }) => !clue.clueText?.trim()))) {
    return NextResponse.json({ error: "Riddles require four or five completed clues." }, { status: 400 });
  }
  delete body.riddleClues;
  const isGhanaContext =
    body.isGhanaContext === true ||
    body.isGhanaContext === "true" ||
    body.ghanaContext === true ||
    body.ghanaContext === "true";

  const question = await prisma.question.create({
    data: {
      ...body,
      timeLimitSeconds: Number(body.timeLimitSeconds || 30),
      sourceYear: body.sourceYear ? Number(body.sourceYear) : null,
      numericTolerance: body.numericTolerance ? Number(body.numericTolerance) : null,
      ghanaContext: isGhanaContext,
      isGhanaContext,
      reviewStatus: "PENDING_REVIEW",
      isPrivateOnly: true,
      isPastQuestion: body.isPastQuestion === true || body.isPastQuestion === "true",
      acceptedAnswers: typeof body.acceptedAnswers === "string" ? body.acceptedAnswers : JSON.stringify(body.acceptedAnswers || []),
      tags: typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags || []),
      riddleClues: riddleClues.length
        ? {
            create: riddleClues.map((clue: { clueNumber: number; clueText: string }, index: number) => ({
              clueNumber: Number(clue.clueNumber),
              clueText: clue.clueText,
              points: [5, 4, 3, 3, 3][index],
            })),
          }
        : undefined,
    },
    include: { riddleClues: true },
  });
  await prisma.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_CREATED", entityType: "Question", entityId: question.id } });
  return NextResponse.json(question, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
