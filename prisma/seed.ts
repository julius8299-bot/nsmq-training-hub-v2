import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { mathematicsQuestions } from "./seed-data/mathematics";
import { physicsQuestions } from "./seed-data/physics";
import { chemistryQuestions } from "./seed-data/chemistry";
import { biologyQuestions } from "./seed-data/biology";
import { supplementalPatternQuestions } from "./seed-data/supplemental-patterns";
import { advancedFinalQuestions } from "./seed-data/advanced-final-questions";
import { validateQuestions, type SeedQuestion } from "./seed-data/question-factory";

const questions = [
  ...mathematicsQuestions,
  ...physicsQuestions,
  ...chemistryQuestions,
  ...biologyQuestions,
  ...supplementalPatternQuestions,
  ...advancedFinalQuestions,
];

function databaseRow(question: SeedQuestion) {
  const { riddleClues: _riddleClues, acceptedAnswers, tags, ...data } = question;
  return {
    ...data,
    acceptedAnswers: JSON.stringify(acceptedAnswers),
    tags: JSON.stringify(tags),
    sourceName: "NSMQ Training Hub original question factory",
  };
}

async function createInChunks<T>(rows: T[], create: (chunk: T[]) => Promise<unknown>, size = 400) {
  for (let index = 0; index < rows.length; index += size) {
    await create(rows.slice(index, index + size));
  }
}

export async function seedDatabase(client?: PrismaClient) {
  const database = client ?? new PrismaClient();
  const shouldDisconnect = !client;
  validateQuestions(questions);

  try {
    await database.attempt.deleteMany();
    await database.riddleClue.deleteMany();
    await database.question.deleteMany();
    await database.topic.deleteMany();
    await database.user.deleteMany();

    await database.user.createMany({
      data: [
        { name: "Demo Student", email: "student@nsmqhub.local", role: "STUDENT" },
        { name: "Demo Coach", email: "coach@nsmqhub.local", role: "COACH" },
      ],
    });

    const standardQuestions = questions.filter((question) => question.roundType !== "RIDDLE");
    await createInChunks(
      standardQuestions.map(databaseRow),
      (data) => database.question.createMany({ data }),
    );

    for (const question of questions.filter((item) => item.roundType === "RIDDLE")) {
      await database.question.create({
        data: {
          ...databaseRow(question),
          riddleClues: { create: question.riddleClues! },
        },
      });
    }

    const uniqueTopics = [
      ...new Map(
        questions.map((item) => [
          `${item.subject}:${item.topic}`,
          {
            subject: item.subject,
            name: item.topic,
            description: `Practice ${item.topic.toLowerCase()} patterns for ${item.subject.toLowerCase()}.`,
          },
        ]),
      ).values(),
    ];
    await database.topic.createMany({ data: uniqueTopics });

    const count = (field: keyof SeedQuestion, value: string | boolean) =>
      questions.filter((question) => question[field] === value).length;
    const [databaseQuestionCount, databaseGhanaContextCount, databaseGhanaRiddleCount] =
      await Promise.all([
        database.question.count(),
        database.question.count({ where: { isGhanaContext: true } }),
        database.question.count({ where: { isGhanaContext: true, roundType: "RIDDLE" } }),
      ]);

    console.log("NSMQ Training Hub seed complete");
    console.log(`Total questions: ${databaseQuestionCount}`);
    console.log(`Mathematics: ${count("subject", "MATHEMATICS")}`);
    console.log(`Physics: ${count("subject", "PHYSICS")}`);
    console.log(`Chemistry: ${count("subject", "CHEMISTRY")}`);
    console.log(`Biology: ${count("subject", "BIOLOGY")}`);
    console.log(`Ghana-context (database isGhanaContext=true): ${databaseGhanaContextCount}`);
    console.log(`Ghana-context riddles: ${databaseGhanaRiddleCount}`);
    console.log(`Round 1: ${count("roundType", "ROUND_ONE")}`);
    console.log(`Speed Race: ${count("roundType", "SPEED_RACE")}`);
    console.log(`Problem of the Day: ${count("roundType", "PROBLEM_OF_THE_DAY")}`);
    console.log(`True/False: ${count("roundType", "TRUE_FALSE")}`);
    console.log(`Riddles: ${count("roundType", "RIDDLE")}`);
    console.log(`Easy: ${count("difficulty", "EASY")}`);
    console.log(`Medium: ${count("difficulty", "MEDIUM")}`);
    console.log(`Hard: ${count("difficulty", "HARD")}`);
    console.log(`NSMQ Final Level: ${count("difficulty", "NSMQ_FINAL_LEVEL")}`);
  } finally {
    if (shouldDisconnect) await database.$disconnect();
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedDatabase()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
