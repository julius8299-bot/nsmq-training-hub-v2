import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJsonRequest, requireApiUser } from "@/lib/auth/http";
import { prisma } from "@/lib/prisma";

const score = z.number().int().min(-999).max(9999);

/** Saved team-contest results, so a board survives a refresh and coaches can look back. */
export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request, "contest:host");
    const contests = await prisma.contestSession.findMany({
      orderBy: { createdAt: "desc" }, take: 30,
      select: { id: true, title: true, mode: true, teamAScore: true, teamBScore: true, teamCScore: true, currentRound: true, status: true, createdAt: true, stateJson: true, quizmaster: { select: { name: true } } },
    });
    return NextResponse.json({ contests });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiUser(request, "contest:host");
    const input = z.object({
      title: z.string().trim().min(1).max(120),
      teams: z.array(z.object({ name: z.string().trim().min(1).max(60), score })).length(3),
      roundReached: z.number().int().min(1).max(5),
      difficulty: z.string().max(40),
    }).strict().parse(await readJsonRequest(request, 4096));
    const contest = await prisma.contestSession.create({ data: {
      title: input.title, mode: "TEAM_CONTEST", status: "COMPLETED", quizmasterId: actor.id,
      teamAScore: input.teams[0].score, teamBScore: input.teams[1].score, teamCScore: input.teams[2].score,
      currentRound: input.roundReached, endsAt: new Date(),
      stateJson: JSON.stringify({ teams: input.teams.map((team) => team.name), difficulty: input.difficulty }),
    } });
    await prisma.auditEvent.create({ data: { actorId: actor.id, action: "CONTEST_SAVED", entityType: "ContestSession", entityId: contest.id } });
    return NextResponse.json({ id: contest.id }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
