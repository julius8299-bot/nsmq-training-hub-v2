import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../prisma/seed";
import { repairGhanaContextFlags } from "../lib/ghana-context";

const prisma = new PrismaClient();

async function main() {
  const questionCount = await prisma.question.count();

  if (questionCount > 0) {
    const repairedCount = await repairGhanaContextFlags(prisma);
    const ghanaContextCount = await prisma.question.count({
      where: { isGhanaContext: true },
    });
    console.log(
      `Database ready: ${questionCount} questions (${ghanaContextCount} Ghana-context, ${repairedCount} flags repaired).`,
    );
    return;
  }

  console.log("Question Bank is empty. Loading the original training bank...");
  await seedDatabase(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
