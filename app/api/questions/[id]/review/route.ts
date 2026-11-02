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
      revision: z.number().int().positive(),
    }).strict().parse(await readJsonRequest(request, 16_384));
    const question = await prisma.question.findUnique({ where: { id }, include: { sourceDocument: true } });
    if (!question || question.archivedAt) throw new AccessError(404, "Question not found.");
    if (question.revision !== input.revision) throw new AccessError(409, "Question changed. Review the latest revision.");
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
    await prisma.$transaction(async (tx) => {
      const updated = await tx.question.updateMany({
        where: { id, revision: input.revision, reviewStatus: question.reviewStatus, archivedAt: null },
        data: { reviewStatus: input.decision, isPrivateOnly: input.decision !== "APPROVED" },
      });
      if (updated.count !== 1) throw new AccessError(409, "Question changed. Review the latest revision.");
      await tx.questionReview.create({ data: {
        questionId: id, reviewerId: actor.id, decision: input.decision,
        notes: input.notes, questionRevision: input.revision,
      } });
      await tx.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_REVIEWED", entityType: "Question", entityId: id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
