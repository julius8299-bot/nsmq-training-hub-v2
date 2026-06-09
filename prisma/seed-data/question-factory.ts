import { enhanceGeneratedQuestion } from "./quality-upgrades";

export type RoundType = "ROUND_ONE" | "SPEED_RACE" | "PROBLEM_OF_THE_DAY" | "TRUE_FALSE" | "RIDDLE";
export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "NSMQ_FINAL_LEVEL";

export type SeedQuestion = {
  subject: "MATHEMATICS" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
  topic: string;
  subtopic: string;
  roundType: RoundType;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  questionText: string;
  answer: string;
  acceptedAnswers: string[];
  shortcutSolution: string;
  fullSolution: string;
  commonTrap: string;
  encouragement: string;
  repeatedPattern: string;
  patternFamily: string;
  tags: string[];
  ghanaContext: boolean;
  isGhanaContext: boolean;
  sourceType: "ORIGINAL";
  permissionStatus: "ORIGINAL";
  isPastQuestion: false;
  isPrivateOnly: false;
  examinerFocus?: string;
  markingScheme?: string;
  numericTolerance?: number;
  riddleClues?: { clueNumber: number; clueText: string; points: number }[];
};

export const ROUND_QUOTAS: Record<RoundType, number> = {
  ROUND_ONE: 280,
  SPEED_RACE: 240,
  PROBLEM_OF_THE_DAY: 120,
  TRUE_FALSE: 200,
  RIDDLE: 160,
};

export const GHANA_QUOTAS: Record<RoundType, number> = {
  ROUND_ONE: 70,
  SPEED_RACE: 60,
  PROBLEM_OF_THE_DAY: 30,
  TRUE_FALSE: 50,
  RIDDLE: 40,
};

const encouragement = "Sharp training. Name the pattern, correct the trap, and solve the next variation faster.";

export function difficultyFor(index: number): Difficulty {
  const slot = index % 20;
  if (slot < 3) return "EASY";
  if (slot < 8) return "MEDIUM";
  if (slot < 15) return "HARD";
  return "NSMQ_FINAL_LEVEL";
}

export function timeFor(roundType: RoundType, difficulty: Difficulty) {
  if (roundType === "SPEED_RACE") return difficulty === "EASY" ? 15 : 20;
  if (roundType === "TRUE_FALSE") return 25;
  if (roundType === "RIDDLE") return 60;
  if (roundType === "PROBLEM_OF_THE_DAY") return difficulty === "NSMQ_FINAL_LEVEL" ? 300 : 240;
  return difficulty === "EASY" ? 30 : difficulty === "MEDIUM" ? 40 : 55;
}

export function riddleClues(values: string[]) {
  if (values.length < 4 || values.length > 5) throw new Error("Every riddle requires four or five clues.");
  const points = [5, 4, 3, 3, 3];
  return values.map((clueText, index) => ({ clueNumber: index + 1, clueText, points: points[index] }));
}

export function baseQuestion(
  subject: SeedQuestion["subject"],
  roundType: RoundType,
  index: number,
  ghanaContext: boolean,
  data: Omit<SeedQuestion, "subject" | "roundType" | "difficulty" | "timeLimitSeconds" | "encouragement" | "ghanaContext" | "isGhanaContext" | "sourceType" | "permissionStatus" | "isPastQuestion" | "isPrivateOnly">,
): SeedQuestion {
  const difficulty = difficultyFor(index);
  return {
    subject,
    roundType,
    difficulty,
    timeLimitSeconds: timeFor(roundType, difficulty),
    encouragement,
    ghanaContext,
    isGhanaContext: ghanaContext,
    sourceType: "ORIGINAL",
    permissionStatus: "ORIGINAL",
    isPastQuestion: false,
    isPrivateOnly: false,
    ...data,
  };
}

export type RoundBuilder = (index: number, ghanaContext: boolean) => SeedQuestion;

export function buildSubjectBank(builders: Record<RoundType, RoundBuilder>) {
  const questions: SeedQuestion[] = [];
  for (const roundType of Object.keys(ROUND_QUOTAS) as RoundType[]) {
    for (let index = 0; index < ROUND_QUOTAS[roundType]; index += 1) {
      questions.push(enhanceGeneratedQuestion(builders[roundType](index, index < GHANA_QUOTAS[roundType]), index));
    }
  }
  return questions;
}

export function validateQuestions(questions: SeedQuestion[]) {
  const required: (keyof SeedQuestion)[] = [
    "subject", "topic", "subtopic", "roundType", "difficulty", "timeLimitSeconds",
    "questionText", "answer", "acceptedAnswers", "shortcutSolution", "fullSolution",
    "commonTrap", "encouragement", "repeatedPattern", "patternFamily", "sourceType",
    "permissionStatus", "tags",
  ];
  questions.forEach((question, index) => {
    for (const field of required) {
      const value = question[field];
      if (value === undefined || value === null || value === "") {
        throw new Error(`Question ${index + 1} is missing ${field}.`);
      }
    }
    if (question.sourceType !== "ORIGINAL" || question.permissionStatus !== "ORIGINAL") {
      throw new Error(`Question ${index + 1} is not marked original.`);
    }
    if (question.ghanaContext !== question.isGhanaContext) {
      throw new Error(`Question ${index + 1} has mismatched Ghana-context flags.`);
    }
    if (question.roundType === "RIDDLE" && (!question.riddleClues || question.riddleClues.length < 4 || question.riddleClues.length > 5)) {
      throw new Error(`Riddle ${index + 1} does not have four or five clues.`);
    }
    if (
      question.roundType === "RIDDLE" &&
      question.riddleClues?.some((clue, clueIndex) => clue.points !== [5, 4, 3, 3, 3][clueIndex])
    ) {
      throw new Error(`Riddle ${index + 1} does not use 5, 4, 3, 3, 3 scoring.`);
    }
    if (question.roundType === "RIDDLE" && !/who am i\?/i.test(question.questionText)) {
      throw new Error(`Riddle ${index + 1} is not in Who am I? format.`);
    }
    if (question.roundType === "PROBLEM_OF_THE_DAY" && (!question.markingScheme || !question.examinerFocus)) {
      throw new Error(`Problem of the Day ${index + 1} lacks marking metadata.`);
    }
  });
}

export const ghanaScenarios = [
  "a trotro route in Accra", "a Lake Volta survey", "an Akosombo energy lesson",
  "a kente design workshop", "an Adinkra geometry exercise", "a cocoa farm near Sefwi",
  "a kenkey fermentation study", "gari processing in a school lab", "salt winning near Ada",
  "a Harmattan weather station", "a malaria-control survey", "a plantain-ripening experiment",
  "a porous clay-pot cooling test", "a market weighing station", "a charcoal stove test",
  "a sachet-water treatment plant", "a gold-density practical", "a palm-oil separation test",
  "a waakye heat-transfer lesson", "a Ghanaian irrigation farm",
];

export function scenario(index: number, ghanaContext: boolean, generic: string) {
  return ghanaContext ? ghanaScenarios[index % ghanaScenarios.length] : generic;
}
