import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AccessError } from "@/lib/auth/service";
import { canApprove } from "@/lib/auth/policy";
import { questionInput } from "./input";
import { isStudentVisible } from "./visibility";

export type QuestionInput = z.infer<typeof questionInput>;
const RIDDLE_POINTS = [5, 4, 3, 3, 3];
/** Imported past questions start with this shortcut text; they cannot be approved until a real shortcut replaces it. */
export const SHORTCUT_PENDING = "[Shortcut pending]";
export const hasPendingShortcut = (value: string | null | undefined) => (value ?? "").trimStart().startsWith(SHORTCUT_PENDING);

/** Validates a create/edit payload and returns the stored fields (clues kept separately). */
export function prepareQuestion(raw: unknown) {
  const body = questionInput.parse(raw);
  const clues = (body.riddleClues ?? []).map((clue) => clue.clueText.trim()).filter(Boolean);
  if (body.roundType === "RIDDLE" && (clues.length < 3 || clues.length > 5)) {
    throw new AccessError(400, "Riddles need three to five clues.");
  }
  const ghana = body.isGhanaContext === true || body.isGhanaContext === "true" || body.ghanaContext === true || body.ghanaContext === "true";
  const fields = {
    subject: body.subject, topic: body.topic, subtopic: body.subtopic, roundType: body.roundType,
    difficulty: body.difficulty, timeLimitSeconds: body.timeLimitSeconds,
    questionText: body.questionText, answer: body.answer, acceptedAnswers: body.acceptedAnswers,
    numericTolerance: body.numericTolerance === "" || body.numericTolerance === null || body.numericTolerance === undefined ? null : Number(body.numericTolerance),
    shortcutSolution: body.shortcutSolution, fullSolution: body.fullSolution, commonTrap: body.commonTrap,
    encouragement: body.encouragement, repeatedPattern: body.repeatedPattern, patternFamily: body.patternFamily,
    sourceType: body.sourceType, permissionStatus: body.permissionStatus,
    sourceName: body.sourceName || null, sourceUrl: body.sourceUrl || null,
    sourceYear: body.sourceYear === "" || body.sourceYear === null || body.sourceYear === undefined ? null : Number(body.sourceYear),
    contestStage: body.contestStage || null, videoTimestamp: body.videoTimestamp || null,
    tags: body.tags, ghanaContext: ghana, isGhanaContext: ghana,
    isPastQuestion: body.isPastQuestion === true || body.isPastQuestion === "true",
    examinerFocus: body.examinerFocus || null, markingScheme: body.markingScheme || null,
    preamble: body.preamble || null,
  };
  return { fields, clues: body.roundType === "RIDDLE" ? clues : [] };
}
export type PreparedQuestion = ReturnType<typeof prepareQuestion>;

const clueRows = (clues: string[]) => clues.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: RIDDLE_POINTS[index] }));

export async function createQuestion(db: PrismaClient, actorId: string, raw: unknown) {
  const { fields, clues } = prepareQuestion(raw);
  const question = await db.question.create({
    data: {
      ...fields, createdById: actorId, reviewStatus: "PENDING_REVIEW", isPrivateOnly: true,
      riddleClues: clues.length ? { create: clueRows(clues) } : undefined,
    },
    include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
  });
  await db.auditEvent.create({ data: { actorId, action: "QUESTION_CREATED", entityType: "Question", entityId: question.id } });
  return question;
}

/**
 * Editing a question students can already see stores the change as a pending draft; the live version
 * stays in use until a reviewer applies it. Unpublished questions are edited directly and return to review.
 */
export async function editQuestion(db: PrismaClient, actor: { id: string; role: string }, id: string, raw: unknown) {
  const prepared = prepareQuestion(raw);
  const question = await db.question.findUnique({ where: { id } });
  if (!question || question.archivedAt) throw new AccessError(404, "Question not found.");
  if (isStudentVisible(question)) {
    const updated = await db.question.update({
      where: { id },
      data: {
        pendingEditJson: JSON.stringify({ ...prepared, proposedById: actor.id, proposedAt: new Date().toISOString() }),
        revision: { increment: 1 },
      },
      include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    });
    await db.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_EDIT_PROPOSED", entityType: "Question", entityId: id } });
    return { question: updated, pending: true };
  }
  if (actor.role !== "ADMIN" && question.createdById && question.createdById !== actor.id) {
    throw new AccessError(403, "Only the author or an administrator can change an unpublished question.");
  }
  const updated = await db.$transaction(async (tx) => {
    await tx.riddleClue.deleteMany({ where: { questionId: id } });
    return tx.question.update({
      where: { id },
      data: {
        ...prepared.fields, revision: { increment: 1 }, reviewStatus: "PENDING_REVIEW", isPrivateOnly: true, pendingEditJson: null,
        riddleClues: prepared.clues.length ? { create: clueRows(prepared.clues) } : undefined,
      },
      include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    });
  });
  await db.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_EDITED", entityType: "Question", entityId: id } });
  return { question: updated, pending: false };
}

/** Archiving keeps every attempt. Admins can archive anything; coaches only their own unpublished drafts. */
export async function archiveQuestion(db: PrismaClient, actor: { id: string; role: string }, id: string) {
  const question = await db.question.findUnique({ where: { id } });
  if (!question || question.archivedAt) throw new AccessError(404, "Question not found.");
  if (actor.role !== "ADMIN" && (isStudentVisible(question) || question.createdById !== actor.id)) {
    throw new AccessError(403, "Only an administrator can archive this question.");
  }
  await db.$transaction([
    db.question.update({ where: { id }, data: { archivedAt: new Date(), revision: { increment: 1 } } }),
    db.auditEvent.create({ data: { actorId: actor.id, action: "QUESTION_ARCHIVED", entityType: "Question", entityId: id } }),
  ]);
}

export const reviewInput = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().trim().min(10, "Write at least a short note (10+ characters) about what you checked.").max(5000),
  revision: z.number().int().positive(),
  /** Required to publish sourced or past material: the reviewer confirms the team may use it. */
  permissionConfirmed: z.boolean().optional(),
}).strict();

const PUBLISHABLE_PERMISSIONS = ["ORIGINAL", "PUBLIC", "LICENSED"];

export async function reviewQuestion(db: PrismaClient, actor: { id: string; role: string }, id: string, input: z.infer<typeof reviewInput>) {
  const question = await db.question.findUnique({ where: { id } });
  if (!question || question.archivedAt) throw new AccessError(404, "Question not found.");
  if (question.revision !== input.revision) throw new AccessError(409, "Question changed. Review the latest revision.");
  const pending = question.pendingEditJson ? JSON.parse(question.pendingEditJson) as PreparedQuestion & { proposedById?: string } : null;
  const authorId = pending ? pending.proposedById ?? null : question.createdById;
  if (input.decision === "APPROVED" && !canApprove(actor.role, actor.id, authorId)) {
    throw new AccessError(403, "A different coach or an administrator must approve your own question.");
  }
  const candidate = pending ? { ...question, ...pending.fields } : question;
  const sourced = candidate.isPastQuestion || candidate.sourceType !== "ORIGINAL";
  // A reviewer's confirmation that the team may use sourced material is what clears PRIVATE_REVIEW / NEEDS_PERMISSION.
  const permissionStatus = PUBLISHABLE_PERMISSIONS.includes(candidate.permissionStatus) ? candidate.permissionStatus : "LICENSED";
  if (input.decision === "APPROVED") {
    if (hasPendingShortcut(candidate.shortcutSolution)) {
      throw new AccessError(400, "This question still needs a shortcut. Edit it to add one, then approve.");
    }
    if (sourced) {
      if (!candidate.sourceName?.trim() || input.permissionConfirmed !== true) {
        throw new AccessError(400, "Sourced and past questions need a source name and your confirmation that the team may use them.");
      }
    } else if (!PUBLISHABLE_PERMISSIONS.includes(candidate.permissionStatus)) {
      throw new AccessError(400, "Set the permission status to ORIGINAL, PUBLIC or LICENSED before approving.");
    }
  }
  await db.$transaction(async (tx) => {
    let data: Prisma.QuestionUpdateManyMutationInput;
    if (pending && input.decision === "APPROVED") {
      await tx.riddleClue.deleteMany({ where: { questionId: id } });
      if (pending.clues.length) await tx.riddleClue.createMany({ data: clueRows(pending.clues).map((clue) => ({ ...clue, questionId: id })) });
      data = { ...pending.fields, permissionStatus, pendingEditJson: null, reviewStatus: "APPROVED", isPrivateOnly: false };
    } else if (pending) {
      data = { pendingEditJson: null }; // Rejecting a proposed edit leaves the live question untouched.
    } else {
      data = input.decision === "APPROVED"
        ? { reviewStatus: "APPROVED", isPrivateOnly: false, permissionStatus }
        : { reviewStatus: "REJECTED", isPrivateOnly: true };
    }
    const updated = await tx.question.updateMany({ where: { id, revision: input.revision, archivedAt: null }, data });
    if (updated.count !== 1) throw new AccessError(409, "Question changed. Review the latest revision.");
    await tx.questionReview.create({ data: {
      questionId: id, reviewerId: actor.id, decision: input.decision, notes: input.notes, questionRevision: input.revision,
      verificationJson: JSON.stringify({ kind: pending ? "EDIT" : "QUESTION", permissionConfirmed: input.permissionConfirmed === true }),
    } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: pending ? "QUESTION_EDIT_REVIEWED" : "QUESTION_REVIEWED", entityType: "Question", entityId: id } });
  });
}
