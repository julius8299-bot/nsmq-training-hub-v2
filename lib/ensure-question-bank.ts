import { prisma } from "@/lib/prisma";
import { repairGhanaContextFlags } from "@/lib/ghana-context";
import { seedDatabase } from "@/prisma/seed";

const globalForQuestionBank = globalThis as unknown as {
  questionBankInitialization?: Promise<void>;
};

export async function ensureQuestionBank() {
  if (!globalForQuestionBank.questionBankInitialization) {
    globalForQuestionBank.questionBankInitialization = (async () => {
      const count = await prisma.question.count();
      if (count === 0) {
        console.log("Question Bank is empty. Loading seed data before serving requests...");
        await seedDatabase(prisma);
      }

      const repairedCount = await repairGhanaContextFlags(prisma);
      if (repairedCount > 0) {
        console.log(
          `Repaired Ghana-context flags for ${repairedCount} question${repairedCount === 1 ? "" : "s"}.`,
        );
      }
    })().catch((error) => {
      globalForQuestionBank.questionBankInitialization = undefined;
      throw error;
    });
  }

  await globalForQuestionBank.questionBankInitialization;
}
