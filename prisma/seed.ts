import type { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "../lib/prisma-factory";
import { pathToFileURL } from "node:url";
import { ensureRoles } from "../lib/auth/service";
import { importSeedQuestions } from "../lib/questions/seed-import";

export async function seedDatabase(client?: PrismaClient) {
  const database = client ?? createPrismaClient();
  try {
    await ensureRoles(database);
    // Explicit opt-in only: legacy factories are unreviewed and are never run at startup.
    if (process.env.IMPORT_LEGACY_QUESTION_FACTORY === "true") {
      if (process.env.NODE_ENV === "production") throw new Error("Legacy factory import is disabled in production.");
      const [{ mathematicsQuestions }, { physicsQuestions }, { chemistryQuestions }, { biologyQuestions }] = await Promise.all([
        import("./seed-data/mathematics"), import("./seed-data/physics"),
        import("./seed-data/chemistry"), import("./seed-data/biology"),
      ]);
      console.log("Legacy candidates imported for review:", await importSeedQuestions(database, [
        ...mathematicsQuestions, ...physicsQuestions, ...chemistryQuestions, ...biologyQuestions,
      ]));
    }
    const [total, ghana, riddles] = await Promise.all([
      database.question.count(), database.question.count({ where: { isGhanaContext: true } }),
      database.question.count({ where: { isGhanaContext: true, roundType: "RIDDLE" } }),
    ]);
    console.log("Foundation catalog initialized; existing users, questions, and attempts preserved.");
    console.log({ total, ghanaContext: ghana, ghanaContextRiddles: riddles });
  } finally { if (!client) await database.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase().catch((error) => { console.error(error); process.exitCode = 1; });
}
