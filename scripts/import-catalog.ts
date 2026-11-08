import { createPrismaClient } from "../lib/prisma-factory";
import { importCatalog } from "../lib/questions/catalog-import";
import { mathematicsQuestions } from "../prisma/seed-data/mathematics";
import { physicsQuestions } from "../prisma/seed-data/physics";
import { chemistryQuestions } from "../prisma/seed-data/chemistry";
import { biologyQuestions } from "../prisma/seed-data/biology";
import { supplementalPatternQuestions } from "../prisma/seed-data/supplemental-patterns";
import { advancedFinalQuestions } from "../prisma/seed-data/advanced-final-questions";

// Loads the existing 4,226-question training bank into an empty or partial database.
// Questions keep the same live status they have on the current site (legacy, visible to students).
// Safe to run on every deploy: anything already present is skipped and nothing is changed or removed.
const db = createPrismaClient();
async function main() {
  const questions = [
    ...mathematicsQuestions, ...physicsQuestions, ...chemistryQuestions, ...biologyQuestions,
    ...supplementalPatternQuestions, ...advancedFinalQuestions,
  ];
  if (questions.length !== 4226) throw new Error("Expected 4,226 catalog questions, found " + questions.length);
  const result = await importCatalog(db, questions, {
    reviewStatus: "LEGACY_UNREVIEWED", sourceName: "NSMQ Training Hub original question factory",
  });
  const [total, clues] = await Promise.all([db.question.count(), db.riddleClue.count()]);
  console.log("Training bank:", { ...result, questionsInDatabase: total, riddleCluesInDatabase: clues });
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
