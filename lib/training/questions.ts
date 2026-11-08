import type { Prisma, PrismaClient, Question, RiddleClue } from "@prisma/client";
import { parseAcceptedAnswers } from "@/lib/answer-checker";
import { containsText } from "@/lib/prisma-factory";
import { studentVisible } from "@/lib/questions/visibility";
import { DIFFICULTIES, ROUND_TYPES, SUBJECTS } from "@/lib/constants";
import { z } from "zod";

/** What a student sees before answering: no answer, solutions or riddle clue text. */
export function publicQuestion(question: Question & { riddleClues?: RiddleClue[] }) {
  return {
    id: question.id,
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic,
    roundType: question.roundType,
    difficulty: question.difficulty,
    timeLimitSeconds: question.timeLimitSeconds,
    questionText: question.questionText,
    preamble: question.preamble,
    isGhanaContext: question.isGhanaContext || question.ghanaContext,
    clueCount: question.riddleClues?.length ?? 0,
  };
}
export type PublicQuestion = ReturnType<typeof publicQuestion>;

/** Revealed only after the student has answered (or chosen to reveal). */
export function questionFeedback(question: Question & { riddleClues?: RiddleClue[] }) {
  return {
    answer: question.answer,
    acceptedAnswers: parseAcceptedAnswers(question.acceptedAnswers),
    shortcutSolution: question.shortcutSolution,
    fullSolution: question.fullSolution,
    commonTrap: question.commonTrap,
    encouragement: question.encouragement,
    markingScheme: question.markingScheme,
    examinerFocus: question.examinerFocus,
    riddleClues: (question.riddleClues ?? [])
      .sort((a, b) => a.clueNumber - b.clueNumber)
      .map((clue) => ({ clueNumber: clue.clueNumber, clueText: clue.clueText, points: clue.points })),
  };
}
export type QuestionFeedback = ReturnType<typeof questionFeedback>;

const optionalText = z.string().trim().max(200).optional().transform((value) => value || undefined);
export const trainingFilterSchema = z.object({
  subject: z.enum(SUBJECTS).optional().or(z.literal("").transform(() => undefined)),
  topic: optionalText,
  subtopic: optionalText,
  roundType: z.enum(ROUND_TYPES).optional().or(z.literal("").transform(() => undefined)),
  difficulty: z.enum(DIFFICULTIES).optional().or(z.literal("").transform(() => undefined)),
  difficulties: z.string().max(200).optional().transform((value) => value?.split(",").filter(Boolean)),
  patternFamily: optionalText,
  tag: optionalText,
  isGhanaContext: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type TrainingFilter = z.infer<typeof trainingFilterSchema>;

export function trainingWhere(filter: Omit<TrainingFilter, "limit">): Prisma.QuestionWhereInput {
  const difficulties = filter.difficulties?.filter((value) => (DIFFICULTIES as readonly string[]).includes(value));
  return {
    ...studentVisible,
    ...(filter.subject && { subject: filter.subject }),
    ...(filter.topic && { topic: filter.topic }),
    ...(filter.subtopic && { subtopic: filter.subtopic }),
    ...(filter.roundType && { roundType: filter.roundType }),
    ...(filter.difficulty ? { difficulty: filter.difficulty } : difficulties?.length ? { difficulty: { in: difficulties } } : {}),
    ...(filter.patternFamily && { patternFamily: containsText(filter.patternFamily) }),
    ...(filter.tag && { tags: containsText(`"${filter.tag}"`) }),
    ...(filter.isGhanaContext === "true" && { isGhanaContext: true }),
  };
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Random selection of DISTINCT questions (the legacy bank repeats identical question texts many times).
 * Questions this student answered in the last 7 days are used only when nothing fresher is left.
 */
export async function pickQuestions(db: PrismaClient, userId: string, filter: TrainingFilter, excludeIds: string[] = []) {
  const candidates = await db.question.findMany({
    where: { ...trainingWhere(filter), ...(excludeIds.length && { id: { notIn: excludeIds } }) },
    select: { id: true, questionText: true },
  });
  if (!candidates.length) return [];
  const recent = new Set((await db.attempt.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60_000) } },
    select: { question: { select: { questionText: true } } },
  })).map((attempt) => attempt.question.questionText));
  const byText = new Map<string, string[]>();
  for (const candidate of candidates) byText.set(candidate.questionText, [...(byText.get(candidate.questionText) ?? []), candidate.id]);
  const groups = shuffle([...byText.entries()]);
  const fresh = groups.filter(([text]) => !recent.has(text));
  const seen = groups.filter(([text]) => recent.has(text));
  const chosen = [...fresh, ...seen].slice(0, filter.limit).map(([, ids]) => ids[Math.floor(Math.random() * ids.length)]);
  const rows = await db.question.findMany({ where: { id: { in: chosen } }, include: { riddleClues: true } });
  const order = new Map(chosen.map((id, index) => [id, index]));
  return rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!).map(publicQuestion);
}

/** One Problem of the Day for everyone, changing at midnight Ghana time (GMT). */
export async function problemOfTheDay(db: PrismaClient, difficulty?: string, date = new Date()) {
  const where = { ...studentVisible, roundType: "PROBLEM_OF_THE_DAY", ...(difficulty && { difficulty }) };
  const rows = await db.question.findMany({ where, select: { id: true, questionText: true }, orderBy: { id: "asc" } });
  const distinct = [...new Map(rows.map((row) => [row.questionText, row.id])).values()];
  if (!distinct.length) return null;
  const day = Math.floor(date.getTime() / 86_400_000);
  // Spread consecutive days across the bank instead of walking it in order.
  const id = distinct[(day * 7919) % distinct.length];
  const question = await db.question.findUniqueOrThrow({ where: { id }, include: { riddleClues: true } });
  return { question: publicQuestion(question), date: date.toISOString().slice(0, 10) };
}
