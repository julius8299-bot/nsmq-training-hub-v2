import { NextRequest } from "next/server";
import { GET } from "../app/api/questions/route";
import { prisma } from "../lib/prisma";

type QuestionBankResponse = {
  total: number;
  questions: { isGhanaContext: boolean; roundType: string }[];
};

async function check(name: string, query: string, expectedRound?: string) {
  const response = await GET(
    new NextRequest(`http://localhost/api/questions?page=1&pageSize=24&${query}`),
  );

  if (!response.ok) {
    throw new Error(`${name} returned HTTP ${response.status}.`);
  }

  const body = (await response.json()) as QuestionBankResponse;
  if (body.total < 1 || body.questions.length < 1) {
    throw new Error(`${name} returned no questions.`);
  }
  if (query.includes("isGhanaContext=true") && body.questions.some((question) => !question.isGhanaContext)) {
    throw new Error(`${name} returned a question without isGhanaContext=true.`);
  }
  if (expectedRound && body.questions.some((question) => question.roundType !== expectedRound)) {
    throw new Error(`${name} returned a question from the wrong round.`);
  }

  console.log(`${name}: ${body.total} questions`);
}

async function main() {
  if (process.env.SIMULATE_STALE_GHANA_FLAGS === "true") {
    const result = await prisma.question.updateMany({
      where: { isGhanaContext: true },
      data: { isGhanaContext: false },
    });
    console.log(`Simulated stale Ghana flags on ${result.count} questions`);
  }

  await check("All filters cleared", "");
  await check("Ghana-context only", "isGhanaContext=true");
  await check(
    "Round 5 Riddles + Ghana-context only",
    "roundType=RIDDLE&isGhanaContext=true",
    "RIDDLE",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
