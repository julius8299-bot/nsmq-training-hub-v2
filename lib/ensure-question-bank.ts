import { prisma } from "@/lib/prisma";
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
    })().catch((error) => {
      globalForQuestionBank.questionBankInitialization = undefined;
      throw error;
    });
  }

  await globalForQuestionBank.questionBankInitialization;
}
