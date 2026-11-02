import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireApiUser, readJsonRequest } from "@/lib/auth/http";
import { AccessError } from "@/lib/auth/service";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiUser(request, "questions:review");
    const { id } = await context.params;
    const input = z.object({
      decision: z.enum(["APPROVED", "REJECTED"]), notes: z.string().trim().min(10).max(5000),
    }).strict().parse(await readJsonRequest(request, 16_384));
    const question = await prisma.question.findUnique({ where: { id }, include: { sourceDocument: true } });
    if (!question || question.archivedAt) throw new AccessError(404, "Question not found.");
    if (input.decision === "APPROVED") {
      if (!["ORIGINAL", "PUBLIC", "LICENSED"].includes(question.permissionStatus)) {
        throw new AccessError(400, "Permission must be confirmed before approval.");
      }
      if (question.isPastQuestion || question.sourceType !== "ORIGINAL") {
        if (!question.sourceDocument?.permissionEvidenceKey ||
            !["PUBLIC", "LICENSED"].includes(question.sourceDocument.permissionStatus)) {
          throw new AccessError(400, "Imported material requires recorded source permission evidence.");
        }
      }
    }
    await prisma.$transaction([
      prisma.question.update({ where: { id }, data: { reviewStatus: input.decision, isPrivateOnly: input.decision !== "APPROVED" } }),
      prisma.questionReview.create({ data: { questionId: id, reviewerId: actor.id, ...input } }),
      prisma.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_REVIEWED", entityType: "Question", entityId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
