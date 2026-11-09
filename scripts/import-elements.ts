import { createPrismaClient } from "../lib/prisma-factory";
import { importCatalog } from "../lib/questions/catalog-import";
import { elementQuestions } from "../lib/elements/questions";

// Adds the periodic-table drills. They are generated from the checked table in lib/elements/data.ts
// (verified by npm run test:elements), so they go live as AUTO_VERIFIED; coaches can still reject any of them.
// Safe to run on every deploy: questions already present are skipped.
const db = createPrismaClient();
async function main() {
  const questions = elementQuestions();
  const result = await importCatalog(db, questions, { reviewStatus: "AUTO_VERIFIED", sourceName: "Periodic table drill generator (checked data table)" });
  console.log("Element drills:", { generated: questions.length, ...result });
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
