import { NextRequest } from "next/server";
import { GET } from "../app/api/questions/route";
import { CONTEST_MIX } from "../lib/contest-mix";
import { prisma } from "../lib/prisma";

const expectedRiddlePoints = [5, 4, 3, 3, 3];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function checkDifficulty(roundType: string, difficulty: string) {
  const request = new NextRequest(
    `http://localhost/api/questions?roundType=${roundType}&difficulty=${difficulty}&limit=20`,
  );
  const response = await GET(request);
  assert(response.ok, `${roundType} ${difficulty} request returned HTTP ${response.status}.`);
  const questions = (await response.json()) as { difficulty: string; roundType: string }[];
  assert(questions.length > 0, `${roundType} ${difficulty} returned no questions.`);
  assert(
    questions.every((question) => question.roundType === roundType && question.difficulty === difficulty),
    `${roundType} ${difficulty} returned a mismatched question.`,
  );
}

async function main() {
  const [
    total,
    ghanaContext,
    ghanaRiddles,
    finalLevel,
    riddles,
    potd,
  ] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { isGhanaContext: true } }),
    prisma.question.count({ where: { isGhanaContext: true, roundType: "RIDDLE" } }),
    prisma.question.count({ where: { difficulty: "NSMQ_FINAL_LEVEL" } }),
    prisma.question.findMany({
      where: { roundType: "RIDDLE" },
      select: {
        questionText: true,
        riddleClues: {
          orderBy: { clueNumber: "asc" },
          select: { clueNumber: true, points: true, clueText: true },
        },
      },
    }),
    prisma.question.findMany({
      where: { roundType: "PROBLEM_OF_THE_DAY" },
      select: { markingScheme: true, examinerFocus: true, timeLimitSeconds: true },
    }),
  ]);

  assert(total >= 4_200 && total <= 4_500, `Total question count ${total} is outside 4,200-4,500.`);
  assert(ghanaContext >= 1_000, `Ghana-context count ${ghanaContext} is below 1,000.`);
  assert(ghanaRiddles >= 160, `Ghana-context riddle count ${ghanaRiddles} is below 160.`);
  assert(finalLevel >= 1_000, `Final Level count ${finalLevel} is below 1,000.`);
  assert(
    riddles.every(
      (question) =>
        /who am i\?/i.test(question.questionText) &&
        question.riddleClues.length >= 4 &&
        question.riddleClues.length <= 5 &&
        question.riddleClues.every(
          (clue, index) =>
            clue.clueNumber === index + 1 &&
            clue.points === expectedRiddlePoints[index] &&
            clue.clueText.trim().length > 20,
        ),
    ),
    "One or more riddles fail the Who am I? or 5,4,3,3,3 clue requirements.",
  );
  assert(
    potd.every(
      (question) =>
        question.markingScheme?.toLowerCase().includes("mark") &&
        Boolean(question.examinerFocus?.trim()) &&
        question.timeLimitSeconds >= 240,
    ),
    "One or more POTD questions lack 10-mark metadata, examiner focus, or a four-minute timer.",
  );

  const standard = CONTEST_MIX.STANDARD;
  assert(
    Object.keys(standard.PROBLEM_OF_THE_DAY).every((difficulty) =>
      ["HARD", "NSMQ_FINAL_LEVEL"].includes(difficulty),
    ),
    "Standard POTD contains a disallowed difficulty.",
  );
  assert(
    Object.keys(standard.RIDDLE).every((difficulty) =>
      ["HARD", "NSMQ_FINAL_LEVEL"].includes(difficulty),
    ),
    "Standard Riddles contain a disallowed difficulty.",
  );
  assert(
    Object.keys(standard.TRUE_FALSE).every((difficulty) =>
      ["MEDIUM", "HARD", "NSMQ_FINAL_LEVEL"].includes(difficulty),
    ),
    "Standard True/False contains a disallowed difficulty.",
  );
  assert(
    Object.keys(standard.SPEED_RACE).every((difficulty) =>
      ["EASY", "MEDIUM", "HARD"].includes(difficulty),
    ),
    "Standard Speed Race contains a disallowed difficulty.",
  );
  assert(
    (standard.ROUND_ONE.MEDIUM ?? 0) + (standard.ROUND_ONE.HARD ?? 0) >
      (standard.ROUND_ONE.EASY ?? 0) + (standard.ROUND_ONE.NSMQ_FINAL_LEVEL ?? 0),
    "Standard Round 1 is not mostly Medium and Hard.",
  );

  await Promise.all([
    checkDifficulty("ROUND_ONE", "EASY"),
    checkDifficulty("SPEED_RACE", "MEDIUM"),
    checkDifficulty("PROBLEM_OF_THE_DAY", "HARD"),
    checkDifficulty("TRUE_FALSE", "NSMQ_FINAL_LEVEL"),
    checkDifficulty("RIDDLE", "NSMQ_FINAL_LEVEL"),
  ]);

  console.log(`Total questions: ${total}`);
  console.log(`Ghana-context questions: ${ghanaContext}`);
  console.log(`Ghana-context riddles: ${ghanaRiddles}`);
  console.log(`NSMQ Final Level: ${finalLevel}`);
  console.log(`Riddles verified: ${riddles.length}`);
  console.log(`POTD questions verified: ${potd.length}`);
  console.log("Difficulty filters and NSMQ-standard contest mix verified.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
