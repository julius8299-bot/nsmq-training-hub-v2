import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const take = Math.min(Number(params.get("limit") || 20), 250);
  const search = params.get("search")?.trim();

  const questions = await prisma.question.findMany({
    where: {
      ...(params.get("subject") && { subject: params.get("subject")! }),
      ...(params.get("topic") && { topic: params.get("topic")! }),
      ...(params.get("subtopic") && { subtopic: params.get("subtopic")! }),
      ...(params.get("roundType") && { roundType: params.get("roundType")! }),
      ...(params.get("difficulty") && { difficulty: params.get("difficulty")! }),
      ...(params.get("sourceType") && { sourceType: params.get("sourceType")! }),
      ...(params.get("ghanaContext") === "true" && { ghanaContext: true }),
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
    },
    include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    take,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const required = ["subject", "topic", "subtopic", "roundType", "difficulty", "questionText", "answer", "shortcutSolution", "fullSolution", "commonTrap", "encouragement", "repeatedPattern", "patternFamily", "sourceType", "permissionStatus"];
  const missing = required.filter((field) => !String(body[field] ?? "").trim());
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }
  const riddleClues = Array.isArray(body.riddleClues) ? body.riddleClues : [];
  if (body.roundType === "RIDDLE" && (riddleClues.length !== 4 || riddleClues.some((clue: { clueText?: string }) => !clue.clueText?.trim()))) {
    return NextResponse.json({ error: "Riddles require exactly four completed clues." }, { status: 400 });
  }
  delete body.id;
  delete body.createdAt;
  delete body.updatedAt;
  delete body.riddleClues;

  const question = await prisma.question.create({
    data: {
      ...body,
      timeLimitSeconds: Number(body.timeLimitSeconds || 30),
      sourceYear: body.sourceYear ? Number(body.sourceYear) : null,
      numericTolerance: body.numericTolerance ? Number(body.numericTolerance) : null,
      ghanaContext: body.ghanaContext === true || body.ghanaContext === "true",
      acceptedAnswers: typeof body.acceptedAnswers === "string" ? body.acceptedAnswers : JSON.stringify(body.acceptedAnswers || []),
      tags: typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags || []),
      riddleClues: riddleClues.length
        ? {
            create: riddleClues.map((clue: { clueNumber: number; clueText: string; points: number }) => ({
              clueNumber: Number(clue.clueNumber),
              clueText: clue.clueText,
              points: Number(clue.points),
            })),
          }
        : undefined,
    },
    include: { riddleClues: true },
  });
  return NextResponse.json(question, { status: 201 });
}
