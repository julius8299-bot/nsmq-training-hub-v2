import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { checkAnswer } from "@/lib/answer-checker";
import { AccessError } from "@/lib/auth/service";
import { MODE_POINTS } from "@/lib/constants";
import { isStudentVisible } from "@/lib/questions/visibility";
import { publicQuestion, questionFeedback } from "./questions";

export const TRAINING_MODES = [
  "SELF_PRACTICE", "FULL_CONTEST", "TEAM_CONTEST", "SPEED_RACE", "TRUE_FALSE", "RIDDLE", "PROBLEM_OF_THE_DAY", "ELEMENT_DRILL", "MISTAKE_REVIEW",
] as const;
/** Modes where the student picks the clock (or none); everywhere else the question's own limit applies. */
const STUDENT_TIMED_MODES = new Set(["SELF_PRACTICE", "ELEMENT_DRILL"]);
const ALLOWED_PRACTICE_LIMITS = [5, 10, 20, 30, 60, 120];
/** Network delay allowance before an answer counts as late. */
export const GRACE_SECONDS = 3;
const DEFAULT_RIDDLE_POINTS = [5, 4, 3, 3, 3];

export const drawInput = z.object({
  questionId: z.string().min(1).max(100),
  mode: z.enum(TRAINING_MODES),
  timeLimitSeconds: z.number().int().nullable().optional(),
}).strict();

export async function createDraw(db: PrismaClient, userId: string, input: z.infer<typeof drawInput>) {
  const question = await db.question.findUnique({ where: { id: input.questionId }, include: { riddleClues: true } });
  if (!question || !isStudentVisible(question)) throw new AccessError(404, "Question is unavailable.");
  let timeLimitSeconds: number | null = question.timeLimitSeconds;
  if (STUDENT_TIMED_MODES.has(input.mode) && input.timeLimitSeconds !== undefined) {
    if (input.timeLimitSeconds !== null && !ALLOWED_PRACTICE_LIMITS.includes(input.timeLimitSeconds)) {
      throw new AccessError(400, "Unsupported time limit.");
    }
    timeLimitSeconds = input.timeLimitSeconds;
  }
  const clues = [...question.riddleClues].sort((a, b) => a.clueNumber - b.clueNumber);
  const draw = await db.questionDraw.create({
    data: { userId, questionId: question.id, mode: input.mode, timeLimitSeconds, cluesRevealed: clues.length ? 1 : 0 },
  });
  return {
    drawId: draw.id,
    issuedAt: draw.issuedAt,
    timeLimitSeconds,
    question: publicQuestion(question),
    clues: clues.slice(0, 1).map((clue) => ({ clueNumber: clue.clueNumber, clueText: clue.clueText, points: clue.points })),
  };
}

export async function revealNextClue(db: PrismaClient, userId: string, drawId: string) {
  const draw = await db.questionDraw.findFirst({
    where: { id: drawId, userId },
    include: { question: { include: { riddleClues: true } } },
  });
  if (!draw) throw new AccessError(404, "Question not found.");
  const clues = [...draw.question.riddleClues].sort((a, b) => a.clueNumber - b.clueNumber);
  if (draw.answeredAt) throw new AccessError(409, "This riddle has already been answered.");
  if (draw.cluesRevealed >= clues.length) throw new AccessError(409, "All clues are already showing.");
  const updated = await db.questionDraw.updateMany({
    where: { id: drawId, userId, answeredAt: null, cluesRevealed: draw.cluesRevealed },
    data: { cluesRevealed: { increment: 1 } },
  });
  if (updated.count !== 1) throw new AccessError(409, "Clue already revealed. Refresh the riddle.");
  const shown = clues.slice(0, draw.cluesRevealed + 1);
  return { clues: shown.map((clue) => ({ clueNumber: clue.clueNumber, clueText: clue.clueText, points: clue.points })) };
}

export const attemptInput = z.object({
  drawId: z.string().min(1).max(100),
  userAnswer: z.string().max(30_000).default(""),
  /** The on-screen clock ran out before the student answered. */
  timedOut: z.boolean().optional(),
  /** Problem of the Day: the student chose to see the solution without submitting an answer. */
  reveal: z.boolean().optional(),
}).strict();

export async function submitAttempt(db: PrismaClient, userId: string, input: z.infer<typeof attemptInput>) {
  const draw = await db.questionDraw.findFirst({
    where: { id: input.drawId, userId },
    include: { question: { include: { riddleClues: true } } },
  });
  if (!draw) throw new AccessError(404, "Question not found.");
  const now = new Date();
  // Claim the draw atomically: a double click or a replayed request cannot score twice.
  const claimed = await db.questionDraw.updateMany({ where: { id: draw.id, userId, answeredAt: null }, data: { answeredAt: now } });
  if (claimed.count !== 1) throw new AccessError(409, "This question has already been answered.");

  const question = draw.question;
  const elapsed = (now.getTime() - draw.issuedAt.getTime()) / 1000;
  const late = draw.timeLimitSeconds !== null && elapsed > draw.timeLimitSeconds + GRACE_SECONDS;
  const answer = input.userAnswer.trim();
  const revealOnly = Boolean(input.reveal) && !answer;
  const isCorrect = !revealOnly && Boolean(answer) && checkAnswer(answer, question);

  const scoring = MODE_POINTS[question.roundType] ?? { correct: 1, wrong: 0 };
  const clues = [...question.riddleClues].sort((a, b) => a.clueNumber - b.clueNumber);
  const clueIndex = Math.max(draw.cluesRevealed, 1) - 1;
  const correctPoints = question.roundType === "RIDDLE"
    ? clues[clueIndex]?.points ?? DEFAULT_RIDDLE_POINTS[clueIndex] ?? 3
    : scoring.correct;
  // No answer, a timeout, a late answer or a reveal scores 0 (never a penalty); a wrong answer in time gets the round's penalty.
  const pointsAwarded = revealOnly || input.timedOut || late || !answer
    ? 0
    : isCorrect ? correctPoints : scoring.wrong;

  await db.attempt.create({
    data: {
      userId, questionId: question.id, drawId: draw.id,
      userAnswer: revealOnly ? "(revealed solution)" : answer,
      isCorrect, pointsAwarded,
      timeTakenSeconds: Math.round(elapsed * 10) / 10,
      mode: draw.mode,
      lateSubmission: late || Boolean(input.timedOut),
      countsTowardStats: !revealOnly && draw.mode !== "TEAM_CONTEST",
    },
  });
  return {
    isCorrect, pointsAwarded, late: late || Boolean(input.timedOut), revealOnly,
    timeTakenSeconds: Math.round(elapsed * 10) / 10,
    cluesUsed: clues.length ? Math.max(draw.cluesRevealed, 1) : 0,
    feedback: questionFeedback(question),
  };
}
