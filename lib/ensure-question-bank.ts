import { prisma } from "@/lib/prisma";

// Kept for internal compatibility. Reads never seed or rewrite the bank.
export async function ensureQuestionBank() {
  return prisma.question.count();
}
