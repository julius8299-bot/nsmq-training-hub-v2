import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { SeedQuestion } from "../../prisma/seed-data/question-factory";

export function seedFingerprint(question: SeedQuestion) {
  return createHash("sha256").update(JSON.stringify([
    question.subject, question.topic, question.subtopic, question.roundType,
    question.difficulty, question.questionText, question.answer,
    question.riddleClues?.map((clue) => [clue.clueNumber, clue.clueText, clue.points]) ?? [],
  ])).digest("hex");
}

export async function importSeedQuestions(database: PrismaClient, questions: SeedQuestion[]) {
  let inserted = 0;
  let matched = 0;
  for (const question of questions) {
    const seedKey = seedFingerprint(question);
    const keyed = await database.question.findUnique({ where: { seedKey } });
    if (keyed) { matched += 1; continue; }
    const candidates = await database.question.findMany({
      where: { seedKey: null, subject: question.subject, roundType: question.roundType, questionText: question.questionText, answer: question.answer },
      include: { riddleClues: { orderBy: { clueNumber: "asc" } } },
    });
    const existing = candidates.find((candidate) => seedFingerprint(candidate as unknown as SeedQuestion) === seedKey);
    if (existing) {
      await database.question.update({ where: { id: existing.id }, data: { seedKey } });
      matched += 1; continue;
    }
    const { riddleClues, acceptedAnswers, tags, ...data } = question;
    await database.question.create({
      data: {
        ...data, seedKey, acceptedAnswers: JSON.stringify(acceptedAnswers), tags: JSON.stringify(tags),
        reviewStatus: "PENDING_REVIEW", isPrivateOnly: true,
        riddleClues: riddleClues ? { create: riddleClues } : undefined,
      },
    });
    inserted += 1;
  }
  return { inserted, matched };
}
