import type { PrismaClient } from "@prisma/client";
import { publicQuestion } from "./questions";
import { studentVisible } from "@/lib/questions/visibility";

/**
 * Mistake review with spaced repetition, worked out from attempt history (no extra table).
 * A question enters review when it is missed (wrong, late, or solution revealed). Each correct answer
 * in a row pushes the next review further out; four in a row means it is mastered and leaves review.
 * Another miss starts the ladder again.
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7] as const;
const DAY = 86_400_000;
const HISTORY_DAYS = 180;

export type ReviewItem = { questionId: string; dueAt: Date; streak: number; misses: number; lastMissedAt: Date };

export async function reviewSchedule(db: PrismaClient, userId: string, now = new Date()) {
  const attempts = await db.attempt.findMany({
    where: { userId, createdAt: { gte: new Date(now.getTime() - HISTORY_DAYS * DAY) }, mode: { not: "TEAM_CONTEST" } },
    select: { questionId: true, isCorrect: true, lateSubmission: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const byQuestion = new Map<string, typeof attempts>();
  for (const attempt of attempts) {
    const list = byQuestion.get(attempt.questionId) ?? [];
    list.push(attempt); byQuestion.set(attempt.questionId, list);
  }
  const items: ReviewItem[] = [];
  let mastered = 0;
  for (const [questionId, list] of byQuestion) {
    const missed = (attempt: (typeof list)[number]) => !attempt.isCorrect || attempt.lateSubmission;
    const misses = list.filter(missed);
    if (!misses.length) continue;
    let streak = 0;
    for (let index = list.length - 1; index >= 0 && !missed(list[index]); index -= 1) streak += 1;
    if (streak >= REVIEW_INTERVAL_DAYS.length) { mastered += 1; continue; }
    const last = list[list.length - 1];
    items.push({
      questionId, streak, misses: misses.length, lastMissedAt: misses[misses.length - 1].createdAt,
      dueAt: new Date(last.createdAt.getTime() + REVIEW_INTERVAL_DAYS[streak] * DAY),
    });
  }
  // Questions that were unpublished since are dropped.
  const visible = new Set((await db.question.findMany({
    where: { id: { in: items.map((item) => item.questionId) }, ...studentVisible }, select: { id: true },
  })).map((question) => question.id));
  const active = items.filter((item) => visible.has(item.questionId)).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const due = active.filter((item) => item.dueAt <= now);
  return { due, upcoming: active.filter((item) => item.dueAt > now), mastered };
}

/** Due questions (most-missed first, then oldest due), ready for the runner. */
export async function dueReviewQuestions(db: PrismaClient, userId: string, limit = 20, subject?: string) {
  const schedule = await reviewSchedule(db, userId);
  const ordered = [...schedule.due].sort((a, b) => b.misses - a.misses || a.dueAt.getTime() - b.dueAt.getTime());
  const questions = await db.question.findMany({
    where: { id: { in: ordered.map((item) => item.questionId) }, ...(subject ? { subject } : {}), ...studentVisible },
    include: { riddleClues: true },
  });
  const byId = new Map(questions.map((question) => [question.id, question]));
  const picked = ordered.flatMap((item) => byId.has(item.questionId) ? [byId.get(item.questionId)!] : []).slice(0, limit);
  return {
    questions: picked.map(publicQuestion),
    dueCount: schedule.due.length,
    nextDueAt: schedule.upcoming[0]?.dueAt ?? null,
    upcomingCount: schedule.upcoming.length,
    mastered: schedule.mastered,
  };
}
