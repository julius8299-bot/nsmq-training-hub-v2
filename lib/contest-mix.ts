export type ContestDifficulty = "STANDARD" | "BEGINNER" | "ADVANCED";

export const CONTEST_DIFFICULTY_LABELS: Record<ContestDifficulty, string> = {
  STANDARD: "Standard NSMQ Mix",
  BEGINNER: "Beginner Contest",
  ADVANCED: "Advanced Contest",
};

export const CONTEST_TARGETS: Record<string, number> = {
  ROUND_ONE: 6,
  SPEED_RACE: 10,
  PROBLEM_OF_THE_DAY: 1,
  TRUE_FALSE: 6,
  RIDDLE: 5,
};

export const CONTEST_MIX: Record<
  ContestDifficulty,
  Record<string, Partial<Record<string, number>>>
> = {
  STANDARD: {
    ROUND_ONE: { EASY: 1, MEDIUM: 2, HARD: 2, NSMQ_FINAL_LEVEL: 1 },
    SPEED_RACE: { EASY: 2, MEDIUM: 4, HARD: 4 },
    PROBLEM_OF_THE_DAY: { HARD: 2, NSMQ_FINAL_LEVEL: 2 },
    TRUE_FALSE: { MEDIUM: 2, HARD: 2, NSMQ_FINAL_LEVEL: 2 },
    RIDDLE: { HARD: 2, NSMQ_FINAL_LEVEL: 3 },
  },
  BEGINNER: {
    ROUND_ONE: { EASY: 2, MEDIUM: 3, HARD: 1 },
    SPEED_RACE: { EASY: 4, MEDIUM: 4, HARD: 2 },
    PROBLEM_OF_THE_DAY: { HARD: 2 },
    TRUE_FALSE: { EASY: 2, MEDIUM: 3, HARD: 1 },
    RIDDLE: { MEDIUM: 2, HARD: 3 },
  },
  ADVANCED: {
    ROUND_ONE: { MEDIUM: 1, HARD: 3, NSMQ_FINAL_LEVEL: 2 },
    SPEED_RACE: { MEDIUM: 2, HARD: 4, NSMQ_FINAL_LEVEL: 4 },
    PROBLEM_OF_THE_DAY: { HARD: 1, NSMQ_FINAL_LEVEL: 3 },
    TRUE_FALSE: { HARD: 2, NSMQ_FINAL_LEVEL: 4 },
    RIDDLE: { HARD: 1, NSMQ_FINAL_LEVEL: 4 },
  },
};

export function shuffleQuestions<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
